// lib/authOptions.js
import CredentialsProvider from "next-auth/providers/credentials";
import User from '@/models/User';
import dbConnect from '@/lib/dbConnect';
import { comparePassword } from '@/lib/passwordUtils';

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      
      async authorize(credentials) {
        try {
          await dbConnect();
          const email = credentials.email.toLowerCase().trim();
          console.log(`Attempting login for email: ${email}`);
          
          const user = await User.findOne({ email })
            .select('+password +likedProperties');
          
          if (!user) {
            console.log('User not found');
            return null;
          }
          
          console.log(`User found: ${user._id}`);
          
          const isValid = await comparePassword(credentials.password, user.password);
          
          if (!isValid) {
            console.log('Password mismatch');
            return null;
          }
          
          console.log('Login successful');
          
          const likedProperties = user.likedProperties || [];
          
          return { 
            id: user._id.toString(),
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            image: user.image || null,
          }
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = user.role;
      }
      return token;
    },
    
    async session({ session, token }) {
      await dbConnect();
      const dbUser = await User.findById(token.id)
        .select('firstName lastName email image role');
      
      if (!dbUser) return session;
      
      session.user = {
        id: dbUser._id.toString(),
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        email: dbUser.email,
        image: dbUser.image,
        role: dbUser.role,
        name: `${dbUser.firstName} ${dbUser.lastName}`,
      };
      
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export default authOptions;