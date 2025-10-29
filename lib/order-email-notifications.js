// lib/order-email-notifications.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderStatusEmail(email, order, status, firstName) {
  try {
    let subject, html;

    // Convert order._id to string for safe usage
    const orderIdString = order._id.toString();
    const shortOrderId = orderIdString.slice(-8).toUpperCase();

    switch (status) {
      case 'accepted':
        subject = `Your order has been accepted by ${order.restaurantName}!`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #ce5a46, #D22E26); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">TurboEssen</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #374151;">Hello ${firstName},</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.5;">
                Great news! <strong>${order.restaurantName}</strong> has accepted your order and is now preparing your food.
              </p>
              
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 2px solid #10B981;">
                <h3 style="color: #10B981; margin: 0 0 10px 0;">✅ Order Accepted</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Order ID:</strong> #${shortOrderId}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Restaurant:</strong> ${order.restaurantName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                Your order is now being prepared. We'll notify you when it's on the way!
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px;">
                  Thank you for choosing TurboEssen!
                </p>
              </div>
            </div>
          </div>
        `;
        break;

      case 'on_the_way':
        subject = `Your order from ${order.restaurantName} is on the way!`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #ce5a46, #D22E26); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">TurboEssen</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #374151;">Hello ${firstName},</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.5;">
                Excellent! Your order from <strong>${order.restaurantName}</strong> is now on the way to you.
              </p>
              
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 2px solid #3B82F6;">
                <h3 style="color: #3B82F6; margin: 0 0 10px 0;">🚚 Order On The Way</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Order ID:</strong> #${shortOrderId}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Restaurant:</strong> ${order.restaurantName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Status:</strong> Out for delivery</p>
              </div>

              <p style="color: #6b7280; font-size: 14px;">
                Your delicious food should arrive soon. Get ready to enjoy!
              </p>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px;">
                  Thank you for choosing TurboEssen!
                </p>
              </div>
            </div>
          </div>
        `;
        break;

      case 'delivered':
        subject = `Your order from ${order.restaurantName} has been delivered!`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(to right, #ce5a46, #D22E26); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">TurboEssen</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
              <h2 style="color: #374151;">Hello ${firstName},</h2>
              <p style="color: #6b7280; font-size: 16px; line-height: 1.5;">
                Your order from <strong>${order.restaurantName}</strong> has been successfully delivered!
              </p>
              
              <div style="background: white; border-radius: 12px; padding: 20px; margin: 20px 0; border: 2px solid #10B981;">
                <h3 style="color: #10B981; margin: 0 0 10px 0;">🎉 Order Delivered</h3>
                <p style="margin: 5px 0; color: #374151;"><strong>Order ID:</strong> #${shortOrderId}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Restaurant:</strong> ${order.restaurantName}</p>
                <p style="margin: 5px 0; color: #374151;"><strong>Total:</strong> $${order.total.toFixed(2)}</p>
              </div>

              <p style="color: #6b7280; font-size: 16px; line-height: 1.5;">
                Thank you for ordering from TurboEssen! We hope you enjoy your meal. 
                <strong>Don't forget to review your order</strong> to help us improve our service.
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'https://turboessen.de'}/dashboard/orders" 
                   style="display: inline-block; background: linear-gradient(to right, #ce5a46, #D22E26); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  View Your Order
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; font-size: 12px;">
                  TurboEssen - Your favorite food delivery service
                </p>
              </div>
            </div>
          </div>
        `;
        break;

      default:
        return false;
    }

    const { data, error } = await resend.emails.send({
      from: 'TurboEssen <info@turboessen.de>',
      to: email,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error sending order status email:', error);
      return false;
    }

    console.log('Order status email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send order status email:', error);
    return false;
  }
}