const { sendNewPostEmail } = require('../utils/emailHandler');
const { Newsletter } = require('../models');

exports.sendEmailToSubscribers = async (req, res, next) => {
  try {
    const event = req.event;


    const subscribers = await Newsletter.find({ status: 'subscribed' });
    const emails = subscribers.map((subscriber) => subscriber.email);

    await sendNewPostEmail(emails, event.title);


    next();
  } catch (error) {
    console.error("Error sending email:", error);
    next(error);
  }
};

