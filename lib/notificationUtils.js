// lib/notificationUtils.js (Complete implementation)
import dbConnect from '@/lib/dbConnect';
import Notification from '@/models/Notification';
import User from '@/models/User';

export async function createNotification(notificationData) {
  try {
    await dbConnect();
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function notifyNewApplication(application) {
  try {
    await dbConnect();
    // Get all admin users
    const admins = await User.find({ role: 'admin' }).select('_id');
    
    // Create notifications for each admin
    const notificationPromises = admins.map(admin => 
      createNotification({
        userId: admin._id,
        type: 'application_submitted',
        title: 'New Restaurant Application',
        message: `New application from ${application.restaurantName}`,
        relatedId: application._id,
        relatedModel: 'Application'
      })
    );
    
    await Promise.all(notificationPromises);
    console.log(`Created notifications for ${admins.length} admins`);
  } catch (error) {
    console.error('Error in notifyNewApplication:', error);
    throw error;
  }
}

export async function notifyApplicationStatus(userId, application, status) {
  const statusMessages = {
    accepted: {
      title: 'Application Accepted!',
      message: `Congratulations! Your application for "${application.restaurantName}" has been accepted. You are now a restaurant owner.`
    },
    rejected: {
      title: 'Application Declined',
      message: `Your application for "${application.restaurantName}" has been reviewed but unfortunately declined.`
    }
  };

  await createNotification({
    userId,
    type: `application_${status}`,
    title: statusMessages[status].title,
    message: statusMessages[status].message,
    relatedId: application._id,
    relatedModel: 'Application'
  });
}