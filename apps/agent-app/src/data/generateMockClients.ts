import { Client, ClientWithOpportunities, OpportunityType } from '@/types';

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa',
  'Edward', 'Deborah', 'Ronald', 'Stephanie', 'Timothy', 'Rebecca', 'Jason', 'Sharon',
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
];

const activities = [
  'Property inquired', 'Preferences updated', 'Matches added', 'Property saved',
  'Property shared', 'Visit scheduled', 'Visit completed', 'Offer submitted',
  'Created', 'Updated', 'Opportunity created',
];

export const generateManyClients = (count: number): ClientWithOpportunities[] => {
  const clients: ClientWithOpportunities[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const hasEmail = Math.random() > 0.15;
    const isIncoming = Math.random() > 0.85;
    
    // Random date in last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    
    const client: Client = {
      id: `generated-${i + 1}`,
      fullName: `${firstName} ${lastName}`,
      phone: `+1 555 ${String(Math.floor(Math.random() * 900) + 100)} ${String(Math.floor(Math.random() * 9000) + 1000)}`, // Always generate phone
      email: hasEmail ? `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com` : '',
      location: Math.random() > 0.5 ? 'Madrid, Spain' : 'New York, USA',
      preferredLanguage: Math.random() > 0.5 ? 'English' : 'Spanish',
      verificationStatus: isIncoming ? 'incoming' : 'verified',
      lastActivity: activities[Math.floor(Math.random() * activities.length)],
      expiresAt: isIncoming ? new Date(Date.now() + (Math.random() * 48 * 60 * 60 * 1000)).toISOString() : undefined,
      createdAt: date.toISOString(),
      updatedAt: date.toISOString(),
    };

    // Generate 0-3 opportunities per client
    const opportunityCount = Math.floor(Math.random() * 4);
    const opportunities = [];
    const oppTypes: OpportunityType[] = ['buy', 'rent', 'sell', 'lease'];
    
    for (let j = 0; j < opportunityCount; j++) {
      const type = oppTypes[Math.floor(Math.random() * oppTypes.length)];
      opportunities.push({
        id: `gen-opp-${i}-${j}`,
        clientId: client.id,
        type,
        status: ['new', 'qualified', 'active', 'under-offer'][Math.floor(Math.random() * 4)] as any,
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Property`,
        priceRange: {
          min: 100000,
          max: 500000,
          currency: '$',
        },
        bedrooms: Math.floor(Math.random() * 5) + 1,
        bathrooms: Math.floor(Math.random() * 3) + 1,
        sizeRange: {
          min: 80,
          max: 200,
          unit: 'm²',
        },
        neighborhoods: ['Downtown'],
        tags: [],
        portalBadges: ['zillow'],
        source: 'zillow',
        updatesCount: Math.floor(Math.random() * 5),
        pendingActions: [],
        propertyTypes: ['Apartment'],
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
      });
    }

    clients.push({ ...client, opportunities });
  }
  
  return clients;
};
