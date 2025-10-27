// app/api/reports/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import dbConnect from '@/lib/dbConnect';
import Report from '@/models/Report';
import User from '@/models/User';

// GET: Fetch reports (admin sees all, users see only their own)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    const targetType = searchParams.get('targetType');

    let query = {};
    let reports;

    if (session.user.role === 'admin') {
      // Admin can see all reports with filters
      if (status) query.status = status;
      if (targetType) query.targetType = targetType;
      
      reports = await Report.find(query)
        .populate('reporterId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    } else {
      // Users can only see their own reports
      query.reporterId = session.user.id;
      if (status) query.status = status;
      if (targetType) query.targetType = targetType;
      
      reports = await Report.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const total = await Report.countDocuments(query);

    return NextResponse.json({ 
      success: true, 
      reports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' }, 
      { status: 500 }
    );
  }
}

// POST: Create a new report
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetType, targetId, reason, description } = await request.json();

    // Validate required fields
    if (!targetType || !targetId || !reason || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    if (!['restaurant', 'review'].includes(targetType)) {
      return NextResponse.json(
        { error: 'Invalid target type' }, 
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already reported this item
    const existingReport = await Report.findOne({
      reporterId: session.user.id,
      targetType,
      targetId
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this item' }, 
        { status: 400 }
      );
    }

    // Get reporter name
    const user = await User.findById(session.user.id);
    const reporterName = `${user.firstName} ${user.lastName}`;

    // Create the report
    const newReport = new Report({
      reporterId: session.user.id,
      reporterName,
      targetType,
      targetId,
      reason,
      description
    });

    await newReport.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Report submitted successfully',
      report: newReport
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to submit report' }, 
      { status: 500 }
    );
  }
}