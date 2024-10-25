const plan = require('../models/Plans');
const Campsite = require('../models/campsites')
const Booking = require('../models/booking')
const Refund = require("../models/refund")
const Affiliate = require("../models/Affiliate")
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require("../models/userModel");
const moment = require('moment');

// (priceId, email, isPreSignup, paymentMethodId)
let methods = {

    createModel: async (req, res) => {
        const newPlan = new plan(req.body);
        await newPlan.save();
        res.status(201).send(newPlan);
    },
    updatePlan:async(req,res)=>{
        const { id } = req.params;
        const updateData = {
            title: req.body.title,
            priceId: req.body.priceId,
            planName: req.body.planName,
            price: req.body.price,
            duration: req.body.duration,
            features: req.body.features
        };
    
        try {
            const updatedPlan = await plan.findByIdAndUpdate(id, updateData, { new: true }); // 'new: true' returns the updated object
            if (!updatedPlan) {
                return res.status(404).send({ message: "Plan not found" });
            }
          return  res.send(updatedPlan);
        } catch (error) {
          return  res.status(500).send({ message: "Error updating the plan", error: error.message });
        }
    },
    getSubscriptionForUserFunction: async (req, res) => {
        let { email } = req.token;
        try {
            let { priceId, paymentMethodId, freeTrailDays } = req.body
            console.log("payif",priceId)
            email = email.toLowerCase();
            const customers = await stripe.customers.list({ email });
            console.log("customerlist", customers)
            const ifUser = await User.findOne({ email: email })
            console.log("user", ifUser)
           const ifPlan = await plan.findOne({ priceId: priceId });
           console.log("pay",ifPlan)
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
                affiliatedUser = await Affiliate.findOne({ userId: ifUser.referredBy });
            }
            console.log("affiliate", affiliatedUser)

            // const paymentMethod = await stripe.paymentMethods.create({
            //     type: 'card',
            //     card: {
            //         token: 'tok_visa'  // Using a test token instead of raw card details
            //     }
            // });
            // console.log("method", paymentMethod);
            // paymentMethodId = paymentMethod.id
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
                console.log("subscription", subscription)
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
    stripeWebhooks: async (req, res, next) => {
        // Get the Stripe signature from the headers
        const signature = req.headers['stripe-signature'];
        console.log("rawbody", req.body)
        console.log("signature", signature)
        console.log("event recieing")
        try {
            // Verify the webhook signature using your Stripe webhook signing secret
            console.log("process.env.STRIPE_WEBHOOK_SECRET ", process.env.STRIPE_WEBHOOK_SECRET)
            const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
            // Handle the event based on its type
            console.log("event", event)
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
                    ifPlan = await plan.findOne({ priceId: priceId });
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
                    ifPlan = await plan.findOne({ priceId: priceId });
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
                                subscriptionId: "",
                                // shouldLoginAfter: dateAndTimeAfter48Hours, // Assuming this property is commented out intentionally
                                subscriptionStatus: "canceled",
                                planId:""                            },
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
    getPlan: async (req, res) => {
        try {
            const plans = await plan.find({});
            return res.status(200).json(plans);
        } catch (error) {
            console.error('Error fetching plans:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    securePayment2: async (req, res) => {
        try {
            let { _id, email } = req.token;
            console.log("data", _id, email);

            const { campsiteId } = req.params;
            let { currency, noOfDays, noOfPersons, pricePerDay, startDate, endDate } = req.body;

            // Set default currency if not provided
            if (!currency) {
                currency = 'USD';
            }

            // Calculate the total amount
            let totalAmount = noOfDays * noOfPersons * pricePerDay;
            console.log("Total Amount: ", totalAmount);

            // Check if customer already exists in Stripe
            let existingCustomers = await stripe.customers.list({ email: email });
            console.log("existingCustomers", existingCustomers);

            // If customer exists, create payment intent
            if (existingCustomers.data.length) {
                console.log("Dont create customer", existingCustomers.data[0].id);

                const paymentIntent = await stripe.paymentIntents.create({
                    amount: Math.round(totalAmount * 100), // amount is in cents
                    currency: currency,
                    customer: existingCustomers.data[0].id,
                    description: "Customer Payment",
                    metadata: {
                        userId: _id,
                        campsiteId: campsiteId,
                        noOfDays: noOfDays,
                        noOfPersons: noOfPersons,
                        pricePerDay: pricePerDay
                    }
                });

                // Store payment details in the database
                const paymentRecord = new Booking({
                    userId: _id,
                    campsiteId: campsiteId,
                    currency: currency,
                    totalAmount: totalAmount,
                    noOfDays: noOfDays,
                    noOfPersons: noOfPersons,
                    pricePerDay: pricePerDay,
                    startDate: new Date(startDate),
                    endDate: new Date(endDate),
                    paymentIntentId: paymentIntent.id,
                    status: 'pending'
                });
                await paymentRecord.save();

                return res.status(200).send({
                    success: true,
                    message: "Payment has been made",
                    paymentIntent: paymentIntent
                });

            } else {
                console.log("Create customer");
                // Create new customer in Stripe
                const customer = await stripe.customers.create({
                    email: email
                });

                if (customer) {
                    // Create payment intent for the new customer
                    const paymentIntent = await stripe.paymentIntents.create({
                        amount: Math.round(totalAmount * 100),
                        currency: currency,
                        customer: customer.id,
                        description: "Customer Payment",
                        metadata: {
                            userId: _id,
                            campsiteId: campsiteId,
                            noOfDays: noOfDays,
                            noOfPersons: noOfPersons,
                            pricePerDay: pricePerDay
                        }
                    });

                    // Store payment details in the database
                    const paymentRecord = new Booking({
                        userId: _id,
                        campsiteId: campsiteId,
                        currency: currency,
                        totalAmount: totalAmount,
                        noOfDays: noOfDays,
                        noOfPersons: noOfPersons,
                        pricePerDay: pricePerDay,
                        startDate: new Date(startDate),
                        endDate: new Date(endDate),
                        paymentIntentId: paymentIntent.id,
                        status: 'pending'
                    });
                    await paymentRecord.save();

                    return res.status(200).send({
                        success: true,
                        message: "Payment has been made",
                        paymentIntent: paymentIntent
                    });

                } else {
                   return res.status(422).send({
                        success: false,
                        message: "Error Creating New Customer"
                    });
                }
            }
        } catch (err) {
            console.log("Error: ", err);

            if (err.isJoi) {
               return res.status(422).json({
                    success: false,
                    message: err.details[0].message
                });
            } else if (err.type == "StripeInvalidRequestError") {
                console.log("Stripe error");
              return  res.status(400).json({
                    success: false,
                    message: err.raw.message
                });
            } else {
             return   res.status(500).json({
                    success: false,
                    message: "Internal Server Error"
                });
            }
        }
    },
    updateBookingStatus: async (req, res) => {
        try {
            const { status, paymentIntentId } = req.body; // Status can be 'completed' or 'failed'
            console.log("id", paymentIntentId)
            // Validate status input
            if (!['completed', 'failed'].includes(status)) {
                return res.status(400).send({
                    success: false,
                    message: "Invalid status. It must be either 'completed' or 'failed'."
                });
            }

            // Check if the paymentIntent exists in the DB
            let paymentRecord = await Booking.findOne({ paymentIntentId: paymentIntentId });

            if (!paymentRecord) {
                return res.status(404).send({
                    success: false,
                    message: "Payment record not found."
                });
            }

            // Update the payment status in the database
            paymentRecord.status = status;
            await paymentRecord.save();

            res.status(200).send({
                success: true,
                message: `Payment status updated to ${status}`,
                paymentRecord
            });
        } catch (err) {
            console.log("Error: ", err);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    },
    getCompletedBookingsForUser: async (req, res) => {
        try {
            const { _id, email } = req.token;
            console.log("data", _id, email);
    
            // Find all completed bookings for the user
            const completedBookings = await Booking.find({
                userId: _id,
                status: 'completed'
            })
            .populate("userId") // Populate user details (e.g., name, email)
            .populate("campsiteId");
    
            if (!completedBookings.length) {
                return res.status(404).send({
                    success: false,
                    message: "No completed bookings found for this user."
                });
            }
    
             // Calculate refund eligibility based on the booking's created date
        const bookingsWithRefundStatus = completedBookings.map(booking => {
            const createdAt = moment(booking.createdAt); // Using createdAt as the booking creation date
            const daysSinceCreation = moment().diff(createdAt, 'days');
            const refundStatus = daysSinceCreation <= 10; // Check if within 10 days of creation

            return {
                ...booking.toObject(),
                refundStatus
            };
        });
    
            return res.status(200).send({
                success: true,
                message: "Completed bookings retrieved successfully.",
                bookings: bookingsWithRefundStatus
            });
        } catch (err) {
            console.log("Error: ", err);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
    },
    refundCampsiteBooking: async (req, res) => {
        try {
            let { _id, email } = req.token;
            console.log("data", _id, email);
            const { paymentIntentId } = req.body;
    
            // Check if the paymentIntent exists in the DB
            let paymentRecord = await Booking.findOne({ paymentIntentId: paymentIntentId });
            if (!paymentRecord) {
                return res.status(404).send({
                    success: false,
                    message: "Payment record not found."
                });
            }
    
            // Check if the booking was made within the last 10 days
            const bookingTime = new Date(paymentRecord.createdAt);
            const currentTime = new Date();
            const timeDifference = currentTime - bookingTime;
    
            const tenDaysInMilliseconds = 10 * 24 * 60 * 60 * 1000;
    
            if (timeDifference > tenDaysInMilliseconds) {
                return res.status(400).send({
                    success: false,
                    message: "Refund not possible as more than 10 days have passed since the booking."
                });
            }
    
            // Proceed with refund if within 10 days
            const refund = await stripe.refunds.create({
                payment_intent: paymentIntentId,
            });
            console.log("refund", refund);
    
            // Store refund details in the database
            const refundData = new Refund({
                userId: _id,
                amount: refund.amount,
                refundId: refund.id,
                balanceTranctionId: refund.balance_transaction,
                chargeId: refund.charge,
                destinationDetails: refund.destination_details,
                paymentIntendId: refund.payment_intent,
                status: refund.status
            });
            await refundData.save();
    
            // Update the booking record with refundId and status 'canceled'
            paymentRecord.status = 'canceled';
            paymentRecord.refundId = refund.id;
            await paymentRecord.save();
    
            return res.status(200).send({
                success: true,
                message: "Refund processed successfully.",
                Refund: refundData
            });
    
        } catch (error) {
            console.log("error", error);
    
            // Check if the error is due to the PaymentIntent not having a successful charge
            if (error.type === 'StripeInvalidRequestError' && error.raw && error.raw.message.includes('does not have a successful charge to refund')) {
                return res.status(400).send({
                    success: false,
                    message: "Refund not possible as the payment is still pending or incomplete.",
                    error: error.raw.message
                });
            }
    
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error
            });
        }
    },
    
    getRefundStatus:async(req,res)=>{
        try {
            const {_id}=req.body
            console.log("id",_id)
              let refundRecord = await Refund.findOne({_id });
              console.log("data",refundRecord)
              const refund = await stripe.refunds.retrieve(refundRecord.refundId);
              console.log("record",refund)
              return res.status(200).send({
                success: true,
                message: "Refund Details",
                Refund: refund
            });
        } catch (error) {
            console.log("error",error)
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error:error
            });
        }
    },
    stripetesting: async (req, res,) => {

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
    cancelSubscription:async(req,res)=>{
        try {
            let { _id, email } = req.token;
            const userId = _id
            console.log("id",_id)
            const userInfo = await User.findOne({_id });
            console.log("user",userInfo)
            if(userInfo.subscriptionStatus === "active"){
            const subscription = await stripe.subscriptions.cancel(userInfo.subscriptionId);
            console.log("sub",subscription)
            return res.status(201).send({
                success: true,
                message: 'Subscription canceled',
                email: email,
            });
        }else{
            return res.status(201).send({
                success: true,
                message: 'Subscription is already canceled',
                email: email,
            });
        }
          } catch (err) {
            if (err.type && err.type.startsWith('Stripe')) {
              // handle Stripe error here
              return {
                success: false,
                message: "Stripe error: " + err.message
              };
            } else {
              console.log("err", err)
              // handle other errors here
              return {
                success: false,
                message: "Internal Server Error"
              };
            }
          }
    }

}

module.exports = methods