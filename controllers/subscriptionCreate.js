const plan = require('../models/Plans');
const Campsite = require('../models/campsites')
const Affiliate = require("../models/Affiliate")
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require("../models/userModel");

// (priceId, email, isPreSignup, paymentMethodId)
let methods = {

createModel :async(req,res)=>{
        const newPlan = new plan({priceId:"price_1PaGrbRwImzljb97fhOByaCA",planName:"Campsite monthly subscription"  });
            await newPlan.save();
            res.status(201).send(newPlan);
    },

 getSubscriptionForUserFunction: async(req,res)=>{
    try {
       let {priceId,email,paymentMethodId,freeTrailDays}=req.body
        email = email.toLowerCase();
        const customers = await stripe.customers.list({ email });
        console.log("customerlist",customers)
        const ifUser = await User.findOne({ email: email })
        console.log("user",ifUser)
        
        if (ifUser?.subscriptionStatus == 'active') {
            return res.status(400).send({
                success: true,
                message: 'Youve already active subscription',
                user: ifUser,
            });
        }
          // Check for the promo code and find the corresponding affiliate
          let affiliatedUser = null;
          if (ifUser.referredBy) {
              affiliatedUser = await Affiliate.findOne({ userId:ifUser.referredBy });
          }
          console.log("affiliate",affiliatedUser)

        const paymentMethod = await stripe.paymentMethods.create({
            type: 'card',
            card: {
              token: 'tok_visa'  // Using a test token instead of raw card details
            }
          });
          console.log("method", paymentMethod);
          paymentMethodId = paymentMethod.id
        const customer = customers.data.length ? customers.data[0] : null;
        // let freeTrailDays;
        if (freeTrailDays) {
            console.log('freeTrailDays ', freeTrailDays);
        }
        const today = new Date();
        if (customer) {
            // If the customer exists, attach the PaymentMethod to their account
            await stripe.paymentMethods.attach(paymentMethodId, { customer: customer.id });
            // Create a subscription using the saved PaymentMethod and customer
            let subscription;
                console.log('attaching paymentMethodId ', paymentMethodId);
                subscription = await stripe.subscriptions.create({
                    customer: customer.id,
                    items: [{ price: priceId }],
                    default_payment_method: paymentMethodId,
                    // Start the subscription in 2 days
                    trial_period_days: freeTrailDays ? freeTrailDays : 0,
                });
                console.log("subscription",subscription)
            const ifPlan = await plan.findOne({ priceId: priceId });
            const updatedUser = await User.findOneAndUpdate(
                { _id: ifUser._id },
                {
                    $set: {
                        subscriptionId: subscription.id,
                        subscriptionStatus: subscription.status,
                        planId: ifPlan?._id,
                        isPaid: true
                    }
                },
                { new: true }
            )
            console.log("updatedUser if ", updatedUser)
               // Increment the invitedUser count in Affiliate model
               if (affiliatedUser) {
                await Affiliate.updateOne(
                    { _id: affiliatedUser._id },
                    { $inc: { userInvited: 1 } }
                );
            }
            return res.status(201).send({
                success: true,
                message: 'Subscription created',
                subscriptionId: subscription.id,
                user: updatedUser
            });
            
        } else {
            // If the customer does not exist, create a new customer and attach the PaymentMethod
            const newCustomer = await stripe.customers.create({
                email: email,
                payment_method: paymentMethodId,
            });
            // Create a subscription for the new customer
            // If the customer exists, attach the PaymentMethod to their account
            await stripe.paymentMethods.attach(paymentMethodId, { customer: newCustomer.id });
            // Create a subscription using the saved PaymentMethod and customer
            let subscription;
            console.log('attaching paymentMethodId ', paymentMethodId);
            subscription = await stripe.subscriptions.create({
                customer: newCustomer.id,
                items: [{ price: priceId }],
                default_payment_method: paymentMethodId,
                // Start the subscription in 2 days
                trial_period_days: freeTrailDays ? freeTrailDays : 0,
            });
            const ifPlan = await plan.findOne({ priceId: priceId });
            const updatedUser = await User.findOneAndUpdate(
                { _id: ifUser._id },
                {
                    $set: {
                        subscriptionId: subscription.id,
                        subscriptionStatus: subscription.status,
                        planId: ifPlan?._id,
                        isPaid: true,
                    }
                },
                { new: true }
            )
             // Increment the invitedUser count in Affiliate model
             if (affiliatedUser) {
                await Affiliate.updateOne(
                    { _id: affiliatedUser._id },
                    { $inc: { userInvited: 1 } }
                );
            }
            console.log("updatedUser else ", updatedUser)
            return res.status(201).send({
                success: true,
                message: 'Subscription created',
                subscriptionId: subscription.id,
                user: updatedUser
            });
        }
    } catch (err) {
        console.error(err);
        if (err.type && err.type.startsWith('Stripe')) {
            // handle Stripe error here
            return {
                success: false,
                message: 'Stripe error: ' + err.message,
            };
        } else {
            // handle other errors here
            return {
                success: false,
                message: 'Internal Server Error',
            };
        }
    }
},
stripeWebhooks : async (req, res, next) => {
    // Get the Stripe signature from the headers
    const signature = req.headers['stripe-signature'];
    console.log("rawbody",req.body)
    console.log("signature",signature)
    console.log("event recieing")
    try {
        // Verify the webhook signature using your Stripe webhook signing secret
        console.log("process.env.STRIPE_WEBHOOK_SECRET ", process.env.STRIPE_WEBHOOK_SECRET)
        const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
        // Handle the event based on its type
        console.log("event",event)
        let ifUser = null;
        let customerEmail = null;
        let priceId = null;
        let ifPlan = null;
        switch (event.type) {
            case 'customer.subscription.created':
                const customerSubscriptionCreated = event.data.object;
                console.log("customerSubscriptionCreated ", customerSubscriptionCreated)
                const customer = await stripe.customers.retrieve(
                    customerSubscriptionCreated?.customer
                );
                console.log("customer ", customer)
                customerEmail = customer?.email?.toLowerCase();;
                ifUser = await User.findOne({ email: customerEmail });
                priceId = customerSubscriptionCreated?.plan?.id
                 ifPlan = await plan.findOne({ priceId: priceId } );
                if (ifUser) {
                    console.log("ifUser ", ifUser)
                    console.log("ifPlan ", ifPlan)
                    const subscriptionId = customerSubscriptionCreated?.id;
                    const subscriptionStatus = customerSubscriptionCreated?.status;
                    console.log("subscriptionId, subscriptionStatus ", subscriptionId, subscriptionStatus)
                    if (ifUser?.subscriptionStatus == 'active' && customerSubscriptionCreated?.status == 'incomplete') {
                        //cancel incomplete subscription
                        const deleted = await stripe.subscriptions.del(
                            customerSubscriptionCreated?.id
                        );
                    } else if (customerSubscriptionCreated.status == "active" && customerSubscriptionCreated.status == "trialing") {
                        const updatedUser = await User.findByIdAndUpdate(
                            ifUser.id,
                            {
                                planId: ifPlan?.id,
                                isPaid: true,
                                subscriptionId: subscriptionId,
                                subscriptionStatus: subscriptionStatus,
                            }, 
                            {
                                new: true // This will return the updated document
                            }
                        );
                        console.log("updatedUser ", updatedUser)
                    } else {
                        console.log("subscription failed somehow")
                    }


                }
                // Then define and call a function to handle the event subscription_schedule.aborted
                break;
            case 'customer.subscription.updated':
                const customerSubscriptionUpdated = event.data.object;
                console.log("customerSubscriptionUpdated ", customerSubscriptionUpdated)
                if (customerSubscriptionUpdated.cancel_at_period_end) {
                    // Return a successful response to Stripe
                    return res.sendStatus(200);
                }
                const customer3 = await stripe.customers.retrieve(
                    customerSubscriptionUpdated?.customer
                );
                console.log("customer3 ", customer3)
                customerEmail = customer3?.email?.toLowerCase();
                ifUser = await User.findOne({ email: customerEmail });
                console.log("ifUser ", ifUser)
                const subscriptionId = customerSubscriptionUpdated?.id;
                const subscriptionStatus = customerSubscriptionUpdated?.status;
                console.log("subscriptionId, subscriptionStatus ", subscriptionId, subscriptionStatus)
                priceId = customerSubscriptionUpdated?.plan?.id
                ifPlan = await plan.findOne({ priceId: priceId  });
                if (customerSubscriptionUpdated.status == 'incomplete_expired' || customerSubscriptionUpdated.status == 'incomplete' || customerSubscriptionUpdated.status == 'cancelled') {

                } else if (customerSubscriptionUpdated.status != "active" && customerSubscriptionUpdated.status != "trialing") {
                    const updatedUser = await User.findByIdAndUpdate(
                        ifUser.id,
                        {
                            planId: ifPlan?.id,
                            isPaid: true,
                            subscriptionId: subscriptionId,
                            subscriptionStatus: subscriptionStatus,
                        }, 
                        {
                            new: true // This will return the updated document
                        }
                    );
                    console.log("updatedUser ", updatedUser)
                } else {
                    console.log("its activing and trailing ")
                    const updatedUser = await User.findByIdAndUpdate(
                        ifUser.id,
                        {
                            planId: ifPlan?.id,
                            isPaid: true,
                            subscriptionId: subscriptionId,
                            subscriptionStatus: subscriptionStatus,
                        }, 
                        {
                            new: true // This will return the updated document
                        }
                    );
                    console.log("updatedUser ", updatedUser)
                }
                // Then define and call a function to handle the event subscription_schedule.canceled
                break;
            case 'customer.subscription.deleted':
                const customerSubscriptionDeleted = event.data.object;
                console.log("customerSubscriptionDeleted ", customerSubscriptionDeleted)
                const customer4 = await stripe.customers.retrieve(
                    customerSubscriptionDeleted?.customer
                );
                console.log("customer4 ", customer4)
                customerEmail = customer4.email;
                ifUser = await User.findOne({ email: customerEmail });
                console.log("ifUser ", ifUser)
                if (ifUser?.subscriptionId == customerSubscriptionDeleted.id) {
                    const updatedUser = await User.findByIdAndUpdate(
                        ifUser.id,
                        {
                            isPaid: false,
                            subscriptionId:"",
                            // shouldLoginAfter: dateAndTimeAfter48Hours, // Assuming this property is commented out intentionally
                            subscriptionStatus: "canceled"
                        },
                        {
                            new: true // This will return the updated document
                        }
                    );
                    console.log("updatedUser ", updatedUser)
                }

                // Then define and call a function to handle the event subscription_schedule.canceled
                break;
                case 'payment_intent.succeeded':
                    const paymentIntentSucceeded = event.data.object;
                    console.log("paymentIntentSucceeded", paymentIntentSucceeded);
                    const customer5 = await stripe.customers.retrieve(
                        paymentIntentSucceeded.customer
                    );
                    console.log("customer", customer5);
                    customerEmail = customer5?.email?.toLowerCase();
                    ifUser = await User.findOne({ email: customerEmail });
                    if (ifUser) {
                        // Extract campsiteId and userId from the paymentIntentSucceeded metadata
                        const campsiteId = paymentIntentSucceeded.metadata.campsiteId;
                        const userId = paymentIntentSucceeded.metadata.userId;
    
                        const campsite = await Campsite.findById(campsiteId);
                        if (campsite) {
                            // Add user to campsite's peopleJoined array
                           
                                campsite.peopleJoined.push(userId);
                            
                            // Add campsite to user's CampsitesJoined array
                       
                                ifUser.CampsitesJoined.push(campsiteId);
                            
                            // Save changes
                            await campsite.save();
                            await ifUser.save();
                        } else {
                            console.log('Campsite not found');
                        }
                    } else {
                        console.log('User not found');
                    }
                    break;
                default:
                console.log('Unhandled event type:', event.type);
        }

        // Return a successful response to Stripe
        res.sendStatus(200);
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.sendStatus(400);
    }
},
getPlan: async(req,res)=>{
    try {
        const plans = await plan.find({});
      return  res.status(200).json(plans);
    } catch (error) {
        console.error('Error fetching plans:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
},

 securePayment2 : async (req, res) => {
    try {
        let {_id,email} = req.token;
      console.log("data",_id,email);
      const{campsiteId} = req.params
        let { currency, amount } = req.body;
      if (!currency) {
        currency = 'USD'
      }
      let existingCustomers = await stripe.customers.list({ email: email });
      console.log("existingCustomers", existingCustomers)
      if (existingCustomers.data.length) {
        // don't create customer if already exists
        console.log("Dont create", existingCustomers.data[0].id)
        // create intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: currency,
          customer: existingCustomers.data[0].id,
          description: "Customer Payment",
          metadata: {
            userId: _id,
            campsiteId: campsiteId
          },
        });
        res.status(200).send({
          success: true,
          message: "Payment has been made",
          paymentIntent: paymentIntent
        })
      } else {
        console.log("create customer");
        //create customer first against email
        const customer = await stripe.customers
          .create({
            email:email,
          })
        console.log(customer)
        if (customer) {
          //charge customer after creating customer
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: 'USD',
            customer: customer.id,
            description: "Customer Payment"
          });
          console.log(paymentIntent)
          if (paymentIntent) {
            res.status(200).send({
              success: true,
              message: "Payment has been made",
              paymentIntent: paymentIntent
            })
          }
        } else {
          res.status(422).send({
            success: false,
            message: "Error Creating New Customer"
          })
        }
      }
    }
    catch (err) {
      console.log("err.isJoi: ", err)
      console.log(err.type)
      if (err.isJoi) {
        res.status(422).json({
          success: false,
          message: err.details[0].message
        })
      } else if (err.type == "StripeInvalidRequestError") {
        console.log("stripe error")
        console.log('err.raw ', err.raw.message)
        res.status(400).json({
          success: false,
          message: err.raw.message
        })
      } else {
        res.status(500).json({
          success: false,
          message: "Internal Server Error"
        })
      }
    }
  },
  stripetesting : async (req, res, ) => {

    try {
        const paymentIntent = await stripe.paymentIntents.confirm(
            'pi_3PbhxORwImzljb970qGEJJz8',
            {
              payment_method: 'pm_1PacZ2RwImzljb97EUX6y9ic',
              return_url: 'https://www.example.com',
            }
          );
          return res.send(paymentIntent)
    } catch (error) {
        console.error('Error handling webhook:', error);
        res.sendStatus(400);
    }
},

}

module.exports = methods