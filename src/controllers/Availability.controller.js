import { Availability } from '../models/Availability.model.js';
import moment from 'moment';
import { ApiResponse } from '../utils/ApiResponse.js';

const createAvailability = async (req, res) => {
  try {
    const { timeZone, duration, meetingMode, schedule } = req.body;
    const userId = req.user._id;

    console.log('Incoming data:', req.body);
    console.log('uuuserId :', userId);

    // Validate required fields
    if (!timeZone && !duration && !meetingMode && !schedule) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Determine the duration in days based on the selected duration
    const daysToGenerate = getDurationInDays(duration);

    const availability = {
      userId,
      timeZone,
      duration,
      meetingMode,
      schedule: {},
    };

    // Current start date
    const startDate = moment().startOf('day');

    // Iterate over the days within the specified duration
    for (let i = 0; i < daysToGenerate; i++) {
      const currentDate = startDate.clone().add(i, 'days');
      const dayOfWeek = currentDate.format('dddd'); // e.g., Monday, Tuesday

      // If the `schedule` contains specific dates, use them
      const dateKey = currentDate.format('YYYY-MM-DD');
      if (schedule[dateKey]) {
        availability.schedule[dateKey] = schedule[dateKey]; // Use existing slots for the date
      } else if (schedule[dayOfWeek]) {
        // If no specific date but day of the week exists, generate hourly slots
        let hourlySlotsForDay = [];
        schedule[dayOfWeek].forEach((slot) => {
          const hourlySlots = generateHourlySlots(slot.from, slot.to);
          hourlySlotsForDay = [...hourlySlotsForDay, ...hourlySlots];
        });
        availability.schedule[dateKey] = hourlySlotsForDay;
      }
    }

    // Save the availability to the database
    const newAvailability = new Availability(availability);
    await newAvailability.save();

    return res.status(201).json({
      message: 'Mentor availability saved successfully',
      data: newAvailability,
    });
  } catch (error) {
    console.error('Error creating availability:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

// Utility: Convert duration string to days
const getDurationInDays = (duration) => {
  switch (duration) {
    case '1w':
      return 7;
    case '2w':
      return 14;
    case '3w':
      return 21;
    case '1m':
      return 30;
    case '2m':
      return 60;
    default:
      return 7; // Default to 1 week
  }
};

// Utility: Generate hourly time slots between `from` and `to`
const generateHourlySlots = (from, to) => {
  const slots = [];
  const startTime = moment(from, 'HH:mm');
  const endTime = moment(to, 'HH:mm');

  while (startTime.isBefore(endTime)) {
    const slotEnd = startTime.clone().add(1, 'hour');
    if (slotEnd.isAfter(endTime)) break; // Stop if the slot end exceeds the range
    slots.push({
      from: startTime.format('HH:mm'),
      to: slotEnd.format('HH:mm'),
    });
    startTime.add(1, 'hour'); // Increment by 1 hour
  }

  return slots;
};


//** GETING DATA */
const getAvailabilityForNext4Days = async (req, res) => {
    try {
      const { userId } = req.params;
      console.log("User ID:", userId);
  
      // Fetch the mentor's availability from the database
      const mentorAvailability = await Availability.findOne({ userId });
  
      if (!mentorAvailability) {
        return res.status(404).json({ message: 'Mentor availability not found' });
      }
  
      const today = moment().startOf('day'); // Get the start of the current day
      const finalSchedule = {};
  
      // Check for availability over the next 4 days
      for (let i = 0; i < 4; i++) {
        const currentDate = today.clone().add(i, 'days').format('YYYY-MM-DD'); // Get date in 'YYYY-MM-DD' format
  
        // Check if the schedule has this date
        const slots = mentorAvailability.schedule[currentDate];
  
        // Log the slots for debugging
        console.log("Slots for", currentDate, ":", slots);
  
        // If no slots exist, log the data or assign an empty array
        finalSchedule[currentDate] = slots && slots.length > 0 ? slots : [];
      }
  
      // Respond with the availability for the next 4 days
      return res.status(200).json({
        statusCode: 200,
        data: finalSchedule,
        message: 'Mentor availability fetched successfully',
      });
    } catch (error) {
      console.error('Error fetching mentor availability:', error);
      return res.status(500).json({
        statusCode: 500,
        data: {},
        message: 'Failed to fetch mentor availability data',
      });
    }
  };
  
  
  

export { createAvailability, getAvailabilityForNext4Days };
