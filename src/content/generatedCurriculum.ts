import type { DialogueLine, Lesson, LessonCategory, Speaker } from './types';

type SeedTuple = readonly [
  slug: string,
  title: string,
  situation: string,
  subject: string,
  detail: string,
  outcome: string,
];

type LessonSeed = {
  category: LessonCategory;
  sequence: number;
  values: SeedTuple;
};

const seedGroups: Record<LessonCategory, readonly SeedTuple[]> = {
  Everyday: [
    ['finding-pharmacy-item', 'Finding something at the pharmacy', 'A customer asks where to find an everyday product.', 'the pharmacy shelves', 'find a travel-sized sunscreen', 'the skin-care aisle'],
    ['paying-at-supermarket', 'Paying at the supermarket', 'A cashier and customer clarify bags, payment, and a receipt.', 'the supermarket checkout', 'pay by card and use one bag', 'a printed receipt'],
    ['sharing-gym-equipment', 'Taking turns at the gym', 'Two gym members arrange to share a machine.', 'the rowing machine', 'finish two short sets', 'alternating between sets'],
    ['delivery-handoff', 'The delivery handoff', 'A resident helps a courier find the right entrance.', 'the building entrance', 'reach apartment twenty-four', 'the side door on Pine Street'],
    ['confirming-appointment', 'Confirming an appointment', 'A client checks that the original appointment still works.', 'the dental appointment', 'confirm Tuesday at three', 'keeping the original time'],
    ['running-ten-minutes-late', 'Running ten minutes late', 'A friend gives a useful arrival update.', 'the arrival time', 'get there around six ten', 'meeting inside the lobby'],
    ['spelling-a-name', 'Spelling a name', 'A caller clarifies a name one letter at a time.', 'the booking name', 'spell Noura correctly', 'N as in November'],
    ['fifteen-or-fifty', 'Was that fifteen or fifty?', 'A customer checks an easily confused number.', 'the quoted price', 'confirm the total aloud', 'fifty dollars before tax'],
    ['checking-the-route', 'Checking the route', 'A visitor repeats directions back to confirm them.', 'the walking route', 'reach the public garden', 'turning left after the bridge'],
    ['wrong-order-correction', 'That is not what I ordered', 'A customer corrects a small order mistake calmly.', 'the lunch order', 'get the vegetable wrap', 'replacing the chicken sandwich'],
    ['another-size', 'Do you have another size?', 'A shopper asks about fit and available stock.', 'the jacket size', 'try a medium in navy', 'checking the stockroom'],
    ['exchanging-a-gift', 'Exchanging a gift', 'A shopper explains why an unopened present needs changing.', 'the gift exchange', 'swap the headphones with a receipt', 'store credit for another model'],
    ['street-market-purchase', 'Buying at a street market', 'A shopper asks naturally about price and quantity.', 'the fruit stall', 'buy two kilos of peaches', 'a small discount for two boxes'],
    ['collecting-dry-cleaning', 'Collecting dry cleaning', 'A customer confirms the name and number of items.', 'the dry-cleaning order', 'collect three shirts under Hassan', 'checking the missing blue shirt'],
    ['lost-wallet', 'A missing wallet', 'Two friends calmly retrace the last few stops.', 'the missing wallet', 'remember the last payment', 'calling the bookstore first'],
    ['wrong-address', 'We came to the wrong address', 'Two people correct course without blaming each other.', 'the meeting address', 'find number eighteen on King Road', 'walking back one block'],
    ['lost-property', 'Asking about lost property', 'A traveler describes a missing item precisely.', 'the lost-property desk', 'find a green canvas backpack', 'checking the evening train'],
    ['library-card', 'Getting a library card', 'A new member asks about requirements and borrowing.', 'the library membership', 'register with a local address', 'borrowing up to six books'],
  ],
  Work: [
    ['todays-priorities', 'Today’s priorities', 'Two teammates agree on what should happen first.', 'today’s priorities', 'finish the client summary', 'moving the design review to tomorrow'],
    ['stand-up-update', 'A concise stand-up update', 'A teammate reports progress and one blocker.', 'the morning update', 'complete the search screen', 'getting access to the test account'],
    ['renegotiating-deadline', 'Renegotiating a deadline', 'A teammate explains constraints and offers a realistic date.', 'the delivery deadline', 'finish the report by Thursday', 'sending the final charts on Friday'],
    ['clarifying-the-brief', 'Clarifying the brief', 'Two coworkers check what “done” means.', 'the project brief', 'include mobile and desktop layouts', 'leaving animation for phase two'],
    ['asking-specific-help', 'Could you give me a hand?', 'A coworker requests focused help with one task.', 'the data export', 'check the column mapping', 'reviewing it together after lunch'],
    ['giving-useful-feedback', 'Giving useful feedback', 'A teammate praises one strength and suggests one change.', 'the presentation draft', 'keep the clear opening', 'shortening the final example'],
    ['wrapping-up-meeting', 'Wrapping up a meeting', 'A team confirms owners and next actions.', 'the meeting summary', 'assign the three follow-up tasks', 'sharing notes before five'],
    ['audio-problem-call', 'Can you hear me now?', 'Two colleagues repair an audio problem on a call.', 'the video call audio', 'switch to the headset microphone', 'turning the camera off briefly'],
    ['sorry-to-interrupt', 'Sorry to interrupt', 'Coworkers handle overlapping speech politely.', 'the discussion turn', 'finish one point about the launch', 'inviting Priya to speak next'],
    ['sharing-right-screen', 'Sharing the right screen', 'A presenter corrects a minor screen-sharing mistake.', 'the shared screen', 'show the quarterly dashboard', 'closing the private notes tab'],
    ['async-update', 'Sending an async update', 'A teammate explains why a written response is enough.', 'the project update', 'post the decision in the channel', 'canceling the extra status call'],
    ['across-time-zones', 'Across time zones', 'A remote team finds a considerate meeting window.', 'the meeting window', 'include Cairo and Toronto', 'trying three in the afternoon UTC'],
    ['moving-video-call', 'Moving the video call', 'Two colleagues propose alternatives to a scheduled call.', 'the video call', 'avoid the Tuesday conflict', 'moving it to Wednesday morning'],
    ['pitching-improvement', 'Pitching a small improvement', 'A teammate connects an idea to a practical benefit.', 'the onboarding flow', 'remove one unnecessary form', 'helping new users finish sooner'],
    ['responding-pushback', 'Responding to pushback', 'A colleague acknowledges concern and refines a proposal.', 'the release proposal', 'protect the testing window', 'launching to a smaller group first'],
    ['communicating-uncertainty', 'I am not completely certain', 'A teammate communicates uncertainty responsibly.', 'the traffic estimate', 'share the early numbers carefully', 'checking the logs before confirming'],
    ['taking-ownership', 'That was my mistake', 'A coworker owns an error and explains the correction.', 'the invoice error', 'replace the outdated amount', 'sending a corrected copy today'],
    ['giving-credit', 'Giving a teammate credit', 'A presenter recognizes someone’s contribution publicly.', 'the successful demo', 'credit Mei for the prototype', 'mentioning her testing work as well'],
  ],
  Social: [
    ['seat-free', 'Is this seat free?', 'A passenger begins a brief, friendly conversation.', 'the empty seat', 'sit beside the window', 'moving the bag to the floor'],
    ['ending-hallway-chat', 'Ending a hallway chat', 'A neighbor leaves a friendly conversation naturally.', 'the hallway conversation', 'get back to a waiting call', 'catching up again this weekend'],
    ['lunch-invitation', 'A spontaneous lunch invitation', 'A coworker invites someone without adding pressure.', 'the lunch plan', 'try the new noodle place', 'going next week if today is busy'],
    ['declining-warmly', 'Maybe another time', 'A friend declines an invitation while preserving warmth.', 'the concert invitation', 'rest after a long week', 'joining the next outing instead'],
    ['weekend-recap', 'How was your weekend?', 'A friend shares a concise and lively recap.', 'the weekend story', 'describe a sunrise hike', 'showing one photo afterward'],
    ['introducing-people', 'Introducing two people', 'A host gives useful context without overexplaining.', 'the introduction', 'connect a designer and a photographer', 'mentioning their shared community project'],
    ['forgot-your-name', 'I forgot your name', 'Someone recovers gracefully after forgetting a name.', 'the forgotten name', 'ask for it again politely', 'repeating Farah to remember it'],
    ['specific-compliment', 'Giving a specific compliment', 'A friend makes praise sound sincere and grounded.', 'the compliment', 'notice the thoughtful speech opening', 'asking how it was prepared'],
    ['accepting-compliment', 'Accepting a compliment', 'Someone responds without dismissing kind feedback.', 'the kind feedback', 'accept praise for the dinner', 'sharing credit with the recipe'],
    ['late-apology', 'Apologizing for being late', 'A friend acknowledges the impact and moves forward.', 'the late arrival', 'apologize for missing the opening', 'buying the first round of drinks'],
    ['quiet-evening', 'I need a quiet evening', 'A friend sets a warm and clear boundary.', 'the evening invitation', 'stay home and recharge', 'meeting for breakfast tomorrow'],
    ['repairing-misunderstanding', 'That is not what I meant', 'Two friends repair a misunderstanding directly.', 'the misunderstood comment', 'clarify the intended joke', 'acknowledging how it sounded'],
    ['checking-in', 'You seem quiet today', 'A friend checks in without pushing for details.', 'the quiet mood', 'offer a listening ear', 'giving space if that feels better'],
    ['responding-good-news', 'Responding to good news', 'A friend shows genuine enthusiasm about an achievement.', 'the good news', 'celebrate a new scholarship', 'planning a small dinner'],
    ['acknowledging-setback', 'That must be disappointing', 'A friend acknowledges a setback without fixing it.', 'the disappointing result', 'listen before offering advice', 'checking what support is useful'],
    ['practical-support', 'What would help right now?', 'A friend offers concrete support during a busy day.', 'the support offer', 'help with grocery shopping', 'dropping the bags off after work'],
    ['checking-later', 'Checking in a few days later', 'A friend remembers an earlier concern.', 'the follow-up message', 'ask about the difficult interview', 'offering another call this evening'],
    ['specific-thanks', 'Thanks for being there', 'A friend expresses appreciation with a specific reason.', 'the thank-you', 'mention the late-night phone call', 'saying how much the calm advice helped'],
  ],
  Travel: [
    ['right-platform', 'Finding the right platform', 'A traveler asks station staff and confirms directions.', 'the train platform', 'catch the four-twenty to Brighton', 'using platform six beyond the café'],
    ['missed-stop', 'I think we missed our stop', 'Two passengers decide what to do next.', 'the missed stop', 'reach the museum district', 'getting off and taking the return train'],
    ['rideshare-pickup', 'Finding the rideshare pickup', 'A passenger and driver coordinate by phone.', 'the pickup point', 'meet outside terminal two', 'waiting beside the blue sign'],
    ['hotel-check-in', 'Checking into a hotel', 'A guest confirms a booking and room details.', 'the hotel booking', 'check in under Salma Youssef', 'confirming breakfast starts at seven'],
    ['noisy-room', 'The room is too noisy', 'A hotel guest requests a practical solution.', 'the noisy hotel room', 'sleep away from the elevator', 'moving to a room on the fifth floor'],
    ['afternoon-in-town', 'One afternoon in town', 'A visitor asks a local for a realistic recommendation.', 'the afternoon plan', 'see one historic place and eat nearby', 'walking through the old market'],
    ['return-trip', 'Planning the return trip', 'Two travelers compare departure times.', 'the return journey', 'arrive before the last bus', 'taking the seven-fifteen train'],
    ['transit-card', 'Topping up a transit card', 'A traveler asks about available ticket options.', 'the transit card', 'travel for three more days', 'adding a weekly pass'],
    ['cancelled-train', 'The train has been cancelled', 'Travelers compare practical alternative routes.', 'the cancelled train', 'get to Oxford before noon', 'taking the coach from bay nine'],
    ['disrupted-travel-day', 'A disrupted travel day', 'A traveler gathers facts before choosing a new route.', 'the delayed journey', 'make an evening connection', 'rerouting through Manchester'],
    ['airport-gate-change', 'The gate has changed', 'Two travelers confirm an airport announcement.', 'the new departure gate', 'board the flight to Rome', 'walking to gate C twelve'],
    ['baggage-allowance', 'Checking the baggage allowance', 'A passenger clarifies size and weight limits.', 'the cabin bag', 'carry a small suitcase onboard', 'checking anything over ten kilos'],
    ['asking-window-seat', 'Asking for a window seat', 'A passenger checks whether a seat change is possible.', 'the seat assignment', 'move closer to the window', 'taking seat twenty-two A'],
    ['rental-car-return', 'Returning a rental car', 'A driver confirms fuel and drop-off instructions.', 'the rental return', 'leave the tank full', 'parking in zone B'],
    ['walking-directions', 'Directions through the old town', 'A visitor asks for landmarks instead of street names.', 'the walking directions', 'find the clock tower', 'passing the fountain and turning right'],
    ['ferry-timetable', 'Checking the ferry timetable', 'A traveler confirms the last sailing of the day.', 'the ferry schedule', 'reach the island tonight', 'boarding the eight-thirty sailing'],
    ['hostel-quiet-hours', 'Asking about quiet hours', 'A hostel guest checks a shared-space rule.', 'the hostel rules', 'make an early morning call', 'using the downstairs lounge'],
    ['meeting-point-change', 'Changing the meeting point', 'Travel companions choose a clearer place to meet.', 'the meeting point', 'avoid the crowded main entrance', 'meeting beside the information desk'],
  ],
  Food: [
    ['quick-lunch-order', 'A quick lunch order', 'A customer requests one simple change to a meal.', 'the sandwich order', 'leave out the onions', 'adding extra cucumber instead'],
    ['table-for-two', 'A table for two', 'Guests request seating at a busy restaurant.', 'the restaurant table', 'sit somewhere quiet for two', 'waiting ten minutes for the back room'],
    ['asking-ingredients', 'Asking about ingredients', 'A diner explains a dietary preference clearly.', 'the soup ingredients', 'avoid dairy products', 'choosing the tomato soup'],
    ['server-recommendation', 'What do you recommend?', 'A diner asks a server for useful guidance.', 'the dinner choice', 'find something light and spicy', 'trying the grilled fish'],
    ['wrong-dish', 'This is not my dish', 'A diner reports a mix-up without sounding accusatory.', 'the mixed-up dish', 'receive the mushroom pasta', 'replacing the seafood plate'],
    ['splitting-bill', 'Shall we split the bill?', 'Friends negotiate payment naturally.', 'the dinner bill', 'divide the food evenly', 'paying separately for the drinks'],
    ['welcoming-guest', 'Welcoming a guest', 'A host offers food, drink, and comfort.', 'the guest welcome', 'offer mint tea and a snack', 'bringing a warmer chair to the balcony'],
    ['asking-recipe', 'How did you make this?', 'A guest asks about a simple recipe.', 'the lentil soup recipe', 'learn how it tastes so smoky', 'toasting the spices first'],
    ['cafe-closing-early', 'The café is closing early', 'Friends adapt their order to limited time.', 'the café visit', 'have a quick drink before closing', 'ordering two teas to go'],
    ['bakery-sold-out', 'The bakery is sold out', 'A customer chooses a good alternative.', 'the bakery order', 'buy a whole-grain loaf', 'trying two seeded rolls'],
    ['booking-brunch', 'Booking a weekend brunch', 'A caller checks availability for a small group.', 'the brunch booking', 'reserve for five on Saturday', 'taking the eleven-thirty table'],
    ['takeaway-delay', 'Checking a takeaway delay', 'A customer asks when an order will be ready.', 'the takeaway order', 'collect order forty-seven', 'waiting another eight minutes'],
    ['coffee-too-sweet', 'The coffee is too sweet', 'A customer asks for a drink adjustment politely.', 'the sweet coffee', 'reduce the vanilla syrup', 'remaking it with one pump'],
    ['sharing-dessert', 'Choosing a dessert to share', 'Friends compare two desserts and decide.', 'the dessert choice', 'share something with chocolate', 'ordering the warm brownie'],
    ['picnic-shopping', 'Shopping for a picnic', 'Friends divide a short grocery list.', 'the picnic list', 'bring fruit and cold drinks', 'asking Sami to get the bread'],
    ['leftovers-plan', 'Making a plan for leftovers', 'Housemates decide how to use extra food.', 'the leftover rice', 'avoid wasting tonight’s food', 'making fried rice tomorrow'],
    ['food-allergy-card', 'Explaining a food allergy', 'A traveler checks a dish using clear language.', 'the allergy information', 'avoid peanuts completely', 'asking the kitchen before ordering'],
    ['market-produce', 'Choosing ripe produce', 'A shopper asks a seller for practical advice.', 'the market tomatoes', 'use them for dinner tonight', 'choosing the softer red ones'],
  ],
  Home: [
    ['bathroom-schedule', 'The bathroom schedule', 'Roommates coordinate a busy morning.', 'the morning schedule', 'leave home by seven forty', 'showering at seven first'],
    ['dividing-chores', 'Dividing the chores', 'Housemates agree on fair responsibilities.', 'the weekly chores', 'share the kitchen and floors', 'switching jobs next week'],
    ['music-down', 'Keeping the music down', 'A neighbor makes a respectful noise request.', 'the late music', 'sleep before an early shift', 'lowering it after ten'],
    ['borrowing-tool', 'Borrowing a small tool', 'A neighbor asks for temporary help.', 'the borrowed tool', 'tighten a loose shelf', 'returning the screwdriver tonight'],
    ['broken-tap', 'Reporting a broken tap', 'A tenant explains a repair issue clearly.', 'the leaking tap', 'stop water under the sink', 'sending a plumber this afternoon'],
    ['taking-parcel', 'Taking in a parcel', 'Neighbors arrange a simple favor.', 'the parcel delivery', 'accept a package during work', 'leaving it by the upstairs door'],
    ['recycling-bin', 'Which bin does this go in?', 'Housemates clarify local recycling rules.', 'the recycling question', 'dispose of a glass jar', 'using the green bin without the lid'],
    ['locked-out', 'Locked out', 'A housemate asks for urgent but calm help.', 'the locked door', 'get inside before the rain', 'bringing the spare key downstairs'],
    ['water-under-sink', 'Water under the sink', 'Housemates coordinate an urgent repair.', 'the kitchen leak', 'limit the water damage', 'turning off the valve first'],
    ['internet-down-home', 'The home internet is down', 'A resident reports useful details to support.', 'the internet outage', 'restore the connection for work', 'restarting the main router'],
    ['thermostat-setting', 'Agreeing on the thermostat', 'Housemates balance comfort and energy use.', 'the room temperature', 'keep the flat comfortable overnight', 'setting it to twenty-one'],
    ['guest-staying-over', 'A guest is staying over', 'Housemates prepare the shared space.', 'the overnight guest', 'make the living room comfortable', 'moving the morning workout elsewhere'],
    ['laundry-timing', 'Sharing the washing machine', 'Neighbors coordinate laundry times.', 'the laundry schedule', 'finish two loads before evening', 'using the machine after four'],
    ['plant-watering', 'Watering plants while away', 'A neighbor agrees to a small holiday favor.', 'the plant care', 'water the balcony pots twice', 'leaving the key with reception'],
    ['furniture-delivery', 'Preparing for furniture delivery', 'Housemates clear space and confirm timing.', 'the sofa delivery', 'make room near the front door', 'moving the old chair tonight'],
    ['smoke-alarm', 'The smoke alarm keeps beeping', 'A resident asks maintenance for help.', 'the smoke alarm', 'stop the low-battery sound', 'replacing the battery this morning'],
    ['shared-fridge', 'Making space in the fridge', 'Housemates solve a small storage problem.', 'the crowded fridge', 'fit groceries for the week', 'clearing the expired containers'],
    ['moving-day-boxes', 'Labeling boxes for moving day', 'Friends organize a smoother move.', 'the moving boxes', 'find kitchen items quickly', 'using colored labels by room'],
  ],
  Services: [
    ['phone-plans', 'Comparing phone plans', 'A customer clarifies data, price, and commitment.', 'the mobile plan', 'get twenty gigabytes without a contract', 'choosing the monthly option'],
    ['explaining-haircut', 'Explaining a haircut', 'A client describes the desired change precisely.', 'the haircut', 'keep the length on top', 'trimming the sides a little shorter'],
    ['worth-repairing', 'Is this worth repairing?', 'A customer asks about cost and timing.', 'the laptop repair', 'replace the damaged charging port', 'collecting it next Wednesday'],
    ['where-is-package', 'Where is my package?', 'A customer reports a delayed delivery.', 'the delayed package', 'locate order eight-one-four', 'opening a courier trace'],
    ['return-policy', 'Understanding the return policy', 'A shopper asks what is eligible for return.', 'the return policy', 'return an opened keyboard', 'receiving store credit within thirty days'],
    ['unfamiliar-charge', 'An unfamiliar charge', 'A customer questions a bill clearly.', 'the card charge', 'identify a twelve-dollar fee', 'checking the annual service renewal'],
    ['troubleshooting-step', 'Trying the first troubleshooting step', 'A customer follows and confirms support instructions.', 'the printer problem', 'restore the wireless connection', 'holding the reset button for ten seconds'],
    ['wrong-reservation-date', 'The reservation has the wrong date', 'A customer corrects booking details.', 'the reservation date', 'book the room for August fourteen', 'moving it from August four'],
    ['following-up', 'Following up politely', 'A customer asks about an unanswered request.', 'the support request', 'receive an update on case ninety-two', 'hearing back by tomorrow afternoon'],
    ['thanking-support', 'Thanking someone who solved it', 'A customer closes a support conversation warmly.', 'the support experience', 'recognize the clear instructions', 'leaving positive feedback'],
    ['bank-card-replacement', 'Replacing a bank card', 'A customer confirms security and delivery details.', 'the replacement card', 'cancel the damaged card', 'sending a new one to the home address'],
    ['changing-utility-name', 'Changing a utility account name', 'A resident asks what documents are needed.', 'the electricity account', 'transfer it to a new tenant', 'uploading the lease and ID'],
    ['booking-bike-repair', 'Booking a bicycle repair', 'A cyclist explains a problem and asks about timing.', 'the bicycle service', 'fix a slipping rear brake', 'bringing it in on Monday'],
    ['canceling-subscription', 'Canceling a subscription', 'A customer confirms the final billing date.', 'the streaming subscription', 'stop renewal next month', 'keeping access until September first'],
    ['printing-documents', 'Printing documents at a copy shop', 'A customer explains paper and color choices.', 'the print order', 'make twelve double-sided copies', 'using color for the first page'],
    ['passport-photo', 'Getting a passport photo', 'A customer checks size and delivery format.', 'the passport photo', 'meet the digital application rules', 'receiving both prints and an email copy'],
    ['repair-estimate', 'Asking for a repair estimate', 'A customer separates inspection from approval.', 'the repair estimate', 'understand the washing-machine fault', 'calling before replacing any parts'],
    ['service-appointment-window', 'Confirming a service window', 'A resident narrows down a technician’s arrival.', 'the service visit', 'plan around a morning appointment', 'receiving a call thirty minutes before arrival'],
  ],
  Community: [
    ['community-picnic', 'The community picnic', 'A neighbor invites someone to a local event.', 'the neighborhood picnic', 'join on Sunday afternoon', 'bringing a chair and something to share'],
    ['volunteer-shift', 'Starting a volunteer shift', 'A volunteer understands the first task.', 'the volunteer shift', 'help at the food table', 'sorting the new donations first'],
    ['damaged-streetlight', 'Reporting a damaged streetlight', 'A resident gives an exact location.', 'the broken streetlight', 'report the dark corner safely', 'using the pole number beside Oak Avenue'],
    ['welcoming-club-member', 'Welcoming someone to a club', 'A member explains what usually happens.', 'the book club', 'help a first-time visitor settle in', 'starting with brief introductions'],
    ['meeting-someones-dog', 'Meeting someone’s dog', 'A neighbor asks before interacting with a pet.', 'the friendly dog', 'say hello without startling it', 'letting the dog approach first'],
    ['announcing-event', 'Announcing a small event', 'An organizer gives concise practical details.', 'the courtyard film night', 'invite residents for Friday', 'starting the film at eight'],
    ['pronouncing-name', 'How do I pronounce your name?', 'Someone asks and repeats a name respectfully.', 'the name pronunciation', 'say Ngozi correctly', 'repeating the first syllable slowly'],
    ['local-custom', 'Is that customary here?', 'A newcomer asks about a local convention.', 'the local greeting', 'understand when people bring a small gift', 'asking the host before the visit'],
    ['food-tradition', 'Sharing a food tradition', 'A neighbor explains why a dish matters personally.', 'the family dish', 'describe the holiday bread', 'sharing the memory behind the recipe'],
    ['holiday-plans', 'Different holiday plans', 'Neighbors compare traditions without ranking them.', 'the holiday weekend', 'share two different family routines', 'wishing each other a good celebration'],
    ['avoiding-assumption', 'Replacing a guess with a question', 'A neighbor asks openly instead of assuming.', 'the community schedule', 'check whether Friday works', 'asking for everyone’s availability'],
    ['community-garden', 'Joining the community garden', 'A resident asks how plots and tools are shared.', 'the garden membership', 'help with weekend watering', 'joining the shared herb section'],
    ['school-fundraiser', 'Helping at a school fundraiser', 'Volunteers divide a few practical tasks.', 'the fundraiser table', 'set up before families arrive', 'handling tickets near the entrance'],
    ['neighborhood-watch', 'Sharing a neighborhood update', 'Residents pass on useful facts without spreading rumors.', 'the neighborhood update', 'mention a planned road closure', 'linking to the council notice'],
    ['sports-club-trial', 'Trying a local sports club', 'A visitor asks what to bring to a first session.', 'the club trial', 'join the beginner badminton group', 'bringing indoor shoes and water'],
    ['public-meeting-question', 'Asking at a public meeting', 'A resident poses one focused question.', 'the bus-route proposal', 'ask about the evening service', 'requesting the planned start date'],
    ['donation-dropoff', 'Dropping off a donation', 'A donor checks which items are useful.', 'the donation center', 'give clean winter coats', 'bringing them during Saturday hours'],
    ['local-class-signup', 'Signing up for a local class', 'A resident asks about level and materials.', 'the pottery class', 'join as a complete beginner', 'using tools provided by the studio'],
  ],
  Wellbeing: [
    ['doctor-appointment', 'Booking a doctor’s appointment', 'A patient states availability and purpose briefly.', 'the doctor’s appointment', 'discuss a mild recurring cough', 'taking the Thursday morning slot'],
    ['mild-symptom', 'Describing a mild symptom', 'A patient explains when a symptom started.', 'the mild headache', 'describe two days of discomfort', 'mentioning that rest helps'],
    ['dentist-change', 'Moving a dentist appointment', 'A patient negotiates another suitable day.', 'the dentist appointment', 'avoid a Wednesday work conflict', 'moving it to Friday afternoon'],
    ['pharmacy-directions', 'Following pharmacy directions', 'A customer confirms when to use a product.', 'the pharmacy instructions', 'take the tablets with food', 'starting after breakfast tomorrow'],
    ['taking-sick-day', 'Taking a sick day', 'An employee notifies a manager responsibly.', 'the sick-day message', 'rest and miss the morning shift', 'sending the handover notes now'],
    ['walk-invitation', 'Want to go for a walk?', 'A friend offers gentle encouragement.', 'the walk invitation', 'get some fresh air after work', 'taking the quiet river path'],
    ['evening-routine', 'A better evening routine', 'Friends compare practical sleep habits.', 'the evening routine', 'wind down without a phone', 'reading for twenty minutes instead'],
    ['morning-stretch', 'Starting a morning stretch', 'Housemates plan a brief shared routine.', 'the morning stretch', 'move for ten minutes before breakfast', 'following the simple living-room video'],
    ['work-break', 'Taking a proper work break', 'Coworkers encourage a realistic pause.', 'the lunch break', 'step away from the screen', 'walking to the park for fifteen minutes'],
    ['hydration-reminder', 'Remembering to drink water', 'Friends compare simple reminder systems.', 'the water habit', 'drink regularly during meetings', 'keeping a bottle beside the laptop'],
    ['gym-first-session', 'A first session at the gym', 'A new member asks staff about a gentle start.', 'the first workout', 'learn three basic machines', 'booking the short orientation'],
    ['rest-day', 'Choosing a rest day', 'Training partners adjust a weekly plan.', 'the recovery day', 'avoid overdoing a busy week', 'moving the long run to Sunday'],
    ['healthy-lunch-plan', 'Planning an easier lunch', 'Coworkers choose a practical midday meal.', 'the lunch habit', 'prepare something filling at home', 'bringing soup and fruit tomorrow'],
    ['screen-break', 'Taking a screen break', 'Friends set a small boundary around evening devices.', 'the screen break', 'keep the final hour calm', 'leaving phones outside the bedroom'],
    ['stressful-week', 'Talking about a stressful week', 'A friend listens without giving unwanted advice.', 'the stressful week', 'share what has felt overwhelming', 'asking whether listening or ideas would help'],
    ['weekend-recharge', 'Planning a quiet weekend', 'Friends balance rest with one enjoyable plan.', 'the weekend recharge', 'avoid filling every hour', 'meeting for one relaxed breakfast'],
    ['new-habit-cue', 'Choosing a cue for a new habit', 'Friends connect a small action to a daily routine.', 'the speaking habit', 'practice after morning coffee', 'leaving headphones beside the mug'],
    ['celebrating-progress', 'Noticing small progress', 'Friends recognize an improvement without exaggerating it.', 'the speaking progress', 'notice clearer pauses this month', 'recording one sentence for comparison'],
  ],
  Ideas: [
    ['choosing-movie', 'Choosing a movie', 'Friends compare two options and decide.', 'the movie choice', 'pick something funny and short', 'watching the new comedy'],
    ['weather-plan', 'Weather changed the plan', 'Friends suggest a useful indoor alternative.', 'the rainy-day plan', 'replace the outdoor picnic', 'meeting at the science museum'],
    ['restaurant-decision', 'Choosing a restaurant', 'Friends balance location, food, and price.', 'the restaurant decision', 'stay near the station and spend less', 'trying the family-run café'],
    ['subscriptions', 'Comparing two subscriptions', 'Friends explain the factor that matters most.', 'the subscription choice', 'get reliable offline access', 'choosing the basic annual plan'],
    ['earlier-preference', 'I would rather go earlier', 'A friend expresses a preference without demanding.', 'the departure time', 'avoid the evening traffic', 'leaving just after lunch'],
    ['meeting-middle', 'Meeting in the middle', 'Two people offer a practical compromise.', 'the weekend plan', 'balance rest and sightseeing', 'doing one short trip on Saturday'],
    ['reconsidering', 'Should we reconsider?', 'A teammate reopens a decision tactfully.', 'the original choice', 'account for the higher cost', 'reviewing the smaller option'],
    ['different-view', 'I see it differently', 'Friends disagree while keeping cooperation.', 'the city proposal', 'explain concern about parking', 'supporting the idea with one change'],
    ['final-plan', 'Settling the final plan', 'A group confirms what everyone chose.', 'the final arrangement', 'agree on dinner at seven', 'booking the corner table'],
    ['home-or-office', 'Working from home or the office?', 'Coworkers give balanced personal preferences.', 'the work setting', 'compare focus and collaboration', 'using two office days each week'],
    ['city-transport', 'Improving city transport', 'Friends suggest one realistic change.', 'the transport system', 'make late buses more reliable', 'adding live arrival signs'],
    ['phone-away', 'Putting the phone away', 'Friends discuss attention habits without judging.', 'the phone habit', 'stay present during meals', 'using a shared phone basket'],
    ['cooking-or-ordering', 'Cooking or ordering in?', 'Friends compare convenience and enjoyment.', 'the dinner routine', 'save time on a busy Thursday', 'cooking a quick pasta together'],
    ['exercise-time', 'Morning or evening exercise?', 'Friends explain what works personally.', 'the exercise schedule', 'keep energy steady after work', 'training around six in the evening'],
    ['spoiler-etiquette', 'Please do not spoil it', 'Friends discuss spoiler etiquette playfully.', 'the series discussion', 'include someone two episodes behind', 'waiting until Sunday to discuss the ending'],
    ['social-media-break', 'Taking a social media break', 'A friend explains a temporary choice.', 'the online break', 'create more quiet time this week', 'logging out until Monday'],
    ['partly-agreeing', 'Partly agreeing', 'A speaker shows nuance instead of choosing one side.', 'the new policy', 'support the goal but question the timing', 'suggesting a one-month trial'],
    ['complicated-choice', 'Explaining a complicated choice', 'A friend contrasts priorities clearly.', 'the job decision', 'balance learning with a shorter commute', 'accepting the smaller local company'],
  ],
};

const names = [
  ['Maya', 'Noah'], ['Alex', 'Sam'], ['Lina', 'Omar'], ['June', 'Daniel'], ['Noura', 'Adam'], ['Mei', 'Jonah'],
  ['Priya', 'Leo'], ['Salma', 'Youssef'], ['Farah', 'Eli'], ['Ngozi', 'Marta'], ['Hana', 'Rami'], ['Sofia', 'Karim'],
  ['Leila', 'Ben'], ['Amina', 'Theo'], ['Rina', 'David'], ['Sara', 'Malik'], ['Aya', 'Lucas'], ['Mina', 'Zoe'],
] as const;

const rolePairs: Record<LessonCategory, readonly [string, string]> = {
  Everyday: ['Customer', 'Helper'], Work: ['Teammate', 'Teammate'], Social: ['Friend', 'Friend'], Travel: ['Traveler', 'Local'],
  Food: ['Guest', 'Host'], Home: ['Housemate', 'Housemate'], Services: ['Customer', 'Specialist'], Community: ['Resident', 'Organizer'],
  Wellbeing: ['Speaker', 'Listener'], Ideas: ['Speaker', 'Friend'],
};

const focusCycle = [
  ['Content-word stress', 'Let the key nouns and actions carry the clearest beats.'],
  ['Thought groups', 'Break longer ideas into short groups so they are easier to follow.'],
  ['Linking words', 'Connect familiar word endings and beginnings without rushing.'],
  ['Question intonation', 'Use a gentle rise to keep real questions open and interested.'],
  ['Polite rhythm', 'Keep polite framing light and make the request itself clear.'],
  ['Contrastive stress', 'Make corrected or replacement information the strongest beat.'],
  ['Turn-taking', 'Finish your idea clearly and leave space for the other speaker.'],
  ['Clear details', 'Slow slightly for names, numbers, places, and other key details.'],
  ['Expressive delivery', 'Use a wider but natural pitch range to show your attitude.'],
  ['Calm clarification', 'Pause before the detail that clears up the misunderstanding.'],
] as const;

type DialogueGroups = [string[], string[], string[], string[], string[]];

function dialogueGroups(category: LessonCategory, subject: string, detail: string, outcome: string, variant: number): DialogueGroups {
  if (variant === 1) return [
    [`I wanted to check something about ${subject}.`],
    ['Sure.', 'What do you need?'],
    [`My goal is to ${detail}.`, `One option is ${outcome}.`],
    ['That sounds practical.', 'I think that option will work.'],
    ['Thanks.', `I feel clearer about ${subject} now.`],
  ];
  if (variant === 2) return [
    [`Do you have a minute to discuss ${subject}?`],
    ['Yes, of course.', 'What are you considering?'],
    [`I’m trying to ${detail}.`, `At the moment, I’m considering ${outcome}.`],
    ['I understand.', 'That seems like a sensible next step.'],
    ['Good.', `Let’s use that approach for ${subject}.`],
  ];
  switch (category) {
    case 'Everyday': return [
      [`Could you help me with ${subject}?`],
      ['Of course.', 'What are you trying to do?'],
      [`I need to ${detail}.`, `I was unsure about ${outcome}.`],
      ['In that case,', 'that option should work.'],
      ['Perfect.', 'That clears things up for me.'],
    ];
    case 'Work': return [
      [`Could we talk about ${subject}?`],
      ['Sure.', 'What needs to happen?'],
      [`I need to ${detail}.`, `My suggestion is ${outcome}.`],
      ['That sounds reasonable.', 'Let’s go with that plan.'],
      ['Great.', `We have a clear plan for ${subject}.`],
    ];
    case 'Social': return [
      [`Can I ask you about ${subject}?`],
      ['Of course.', 'What are you thinking?'],
      [`I would like to ${detail}.`, `Maybe ${outcome}.`],
      ['That sounds good.', 'That works for me.'],
      ['Perfect.', `I’m glad we sorted out ${subject}.`],
    ];
    case 'Travel': return [
      [`Could you help me with ${subject}?`],
      ['Certainly.', 'What do you need to do?'],
      [`I need to ${detail}.`, `I heard something about ${outcome}.`],
      ['That’s right.', 'That is the option I would use.'],
      ['Great.', `Now I understand ${subject}.`],
    ];
    case 'Food': return [
      [`Could we sort out ${subject}?`],
      ['Of course.', 'What would you like?'],
      [`I would like to ${detail}.`, `Would ${outcome} be possible?`],
      ['Absolutely.', 'We can make that change.'],
      ['Perfect.', 'Let’s go with that.'],
    ];
    case 'Home': return [
      [`Can we talk about ${subject}?`],
      ['Sure.', 'What do we need to change?'],
      [`I need to ${detail}.`, `I was thinking about ${outcome}.`],
      ['That works for me.', 'Let’s try it.'],
      ['Good.', `That should take care of ${subject}.`],
    ];
    case 'Services': return [
      [`Could I get some help with ${subject}?`],
      ['Certainly.', 'What would you like to do?'],
      [`I need to ${detail}.`, `Would ${outcome} be the next step?`],
      ['Yes.', 'I can arrange that for you.'],
      ['Thanks.', `That clarifies ${subject}.`],
    ];
    case 'Community': return [
      [`I wanted to ask about ${subject}.`],
      ['Of course.', 'How would you like to take part?'],
      [`I would like to ${detail}.`, `I could start with ${outcome}.`],
      ['That would be helpful.', 'Let’s arrange it.'],
      ['Wonderful.', `I feel ready for ${subject}.`],
    ];
    case 'Wellbeing': return [
      [`Could we talk about ${subject}?`],
      ['Of course.', 'What would feel manageable?'],
      [`I would like to ${detail}.`, `I could start with ${outcome}.`],
      ['That sounds realistic.', 'Let’s begin there.'],
      ['Good.', `I feel clearer about ${subject}.`],
    ];
    case 'Ideas': return [
      [`What do you think about ${subject}?`],
      ['It depends.', 'What matters most to you?'],
      [`I want to ${detail}.`, `I’m leaning toward ${outcome}.`],
      ['I see why.', 'That fits your priority.'],
      ['That seems fair.', `We have a direction for ${subject}.`],
    ];
  }
}

const keyword = (value: string) => value.match(/[\p{L}\p{N}]+/gu)?.at(-1) ?? value;

const makeLine = (id: string, speakerId: string, phraseGroups: string[], stressWords: string[], coachNote: string): DialogueLine => ({
  id,
  speakerId,
  phraseGroups,
  text: phraseGroups.join(' '),
  stressWords,
  coachNote,
});

function buildLesson(seed: LessonSeed, index: number): Lesson {
  const [slug, title, situation, subject, detail, outcome] = seed.values;
  const [speakerOne, speakerTwo] = names[seed.sequence % names.length]!;
  const [roleOne, roleTwo] = rolePairs[seed.category];
  const speakers: [Speaker, Speaker] = [
    { id: `${slug}-a`, name: speakerOne, role: roleOne, color: 'lime' },
    { id: `${slug}-b`, name: speakerTwo, role: roleTwo, color: 'coral' },
  ];
  const groups = dialogueGroups(seed.category, subject, detail, outcome, seed.sequence % 3);
  const focus = focusCycle[index % focusCycle.length]!;
  const subjectWord = keyword(subject);
  const detailWord = keyword(detail);
  const outcomeWord = keyword(outcome);
  const linePrefix = `daily-${String(index + 5).padStart(3, '0')}`;
  const lines = [
    makeLine(`${linePrefix}-1`, speakers[0].id, groups[0], [subjectWord], `Give ${subjectWord.toLocaleUpperCase()} a clear beat so the topic is immediately obvious.`),
    makeLine(`${linePrefix}-2`, speakers[1].id, groups[1], [keyword(groups[1].at(-1)!)], `Keep the opening light, then let the question sound genuinely interested.`),
    makeLine(`${linePrefix}-3`, speakers[0].id, groups[2], [detailWord, outcomeWord], `Pause between the need and the proposed option. Keep both details clear.`),
    makeLine(`${linePrefix}-4`, speakers[1].id, groups[3], [keyword(groups[3].at(-1)!)], `Use a calm falling tone to make the response sound settled.`),
    makeLine(`${linePrefix}-5`, speakers[0].id, groups[4], [keyword(groups[4][0]!), keyword(groups[4].at(-1)!)], `Let the first phrase show your reaction, then finish without rushing.`),
  ];

  return {
    id: slug,
    number: index + 5,
    title,
    situation,
    category: seed.category,
    durationSeconds: 38 + (index % 23),
    estimatedMinutes: 7 + (index % 4),
    level: (['A2–B1', 'B1–B2', 'B1–B2', 'B2–C1'] as const)[index % 4]!,
    focus: focus[0],
    intention: focus[1],
    speakers,
    lines,
    expressions: [
      { phrase: lines[0]!.text, meaning: 'A natural way to open this specific conversation.', example: `Use this opener when you need to discuss ${subject}.` },
      { phrase: lines[2]!.phraseGroups[0]!, meaning: 'A clear way to state the practical goal.', example: `Start with the goal: “${lines[2]!.phraseGroups[0]}”` },
    ],
    stressExercise: {
      sentence: `I meant ${subject}, not the other option.`,
      prompt: `Which word makes “${subject}” the correction?`,
      answer: subjectWord,
      options: [
        { word: 'I', meaning: 'You meant it, rather than another person.' },
        { word: 'meant', meaning: 'You meant it, rather than only mentioning it.' },
        { word: subjectWord, meaning: `${subject} is the corrected information.` },
      ],
      coachNote: `Make ${subjectWord.toLocaleUpperCase()} the strongest beat, while keeping the surrounding words light.`,
    },
  };
}

const orderedSeeds: LessonSeed[] = [];
for (let sequence = 0; sequence < 18; sequence += 1) {
  for (const category of Object.keys(seedGroups) as LessonCategory[]) {
    orderedSeeds.push({ category, sequence, values: seedGroups[category][sequence]! });
  }
}

export const generatedLessons = orderedSeeds.map(buildLesson);
