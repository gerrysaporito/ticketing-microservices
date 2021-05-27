import { Ticket } from '../ticket';

it('implments optimistic concurrency control', async (done) => {
  // Create an instance of a ticket
  const ticket =  Ticket.build({
    title: 'concert',
    price: 5,
    userId: '123'
  });

  // Save the ticket to the database
  await ticket.save();

  // Fetch the ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstance = await Ticket.findById(ticket.id);

  // Make 2 seperate changes to the tickets we fetched
  firstInstance!.set({ price: 10 });
  secondInstance!.set({ price: 20 });

  // Save the first fetched ticket
  await firstInstance!.save();

  // Save the second fetched ticket and expect an error
  try {
    await secondInstance!.save();
  } catch(e) {
    return done();
  }

  throw new Error('Should not reach this point because second instance should fail');

  // Should work one day with jest patch
  // expect(async () => {
  //   await secondInstance!.save();
  // }).toThrow()
});

it('increments the version number on multiple saves', async () => {
  // Create an instance of a ticket
  const ticket =  Ticket.build({
    title: 'concert',
    price: 5,
    userId: '123'
  });

  await ticket.save();
  expect(ticket.version).toEqual(0);

  await ticket.save();
  expect(ticket.version).toEqual(1);

  await ticket.save();
  expect(ticket.version).toEqual(2);
});
