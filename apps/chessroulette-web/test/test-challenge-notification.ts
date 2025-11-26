import { io, Socket } from 'socket.io-client';

// Podaci iz URL-a: http://localhost:4200/room/a/match/opwSUaBFW?userDisplayName=Dragutin&userId=8UWCweKl1Gvoi&theme=op
const TARGET_USER_ID = '8UWCweKl1Gvoi'; // Korisnik koji treba da primi notifikaciju
const TARGET_USER_DISPLAY_NAME = 'Dragutin';

// Podaci za challenge notifikaciju
const CHALLENGE_DATA = {
  ch_uuid: `test-challenge-${Date.now()}`, // Generišemo UUID za test
  challenger_id: 'czeKS1Q0JDSXJ', // ID izazivača (možete promeniti)
  challenger_name: 'Test Challenger', // Ime izazivača
  challengee_id: TARGET_USER_ID, // ID korisnika koji prima notifikaciju
  time_class: 'rapid',
  timeClass: 'rapid', // Alternativni format
};

// Socket server URL
const SOCKET_URL = process.env.SOCKET_URL || 'https://api.outpostchess.com';

// Token (možete dodati validan token ako je potreban za admin pristup)
const TOKEN = process.env.TOKEN || '';

async function sendChallengeNotification() {
  console.log('🔌 Povezivanje na socket server...');
  console.log('📍 URL:', SOCKET_URL);
  console.log('🎯 Ciljni korisnik:', TARGET_USER_ID);
  console.log('📋 Challenge podaci:', CHALLENGE_DATA);

  // Kreiraj socket konekciju
  const socket: Socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling', 'webtransport'],
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('✅ Socket povezan!');
    
    // Ako imamo token, autentifikuj se
    if (TOKEN) {
      console.log('🔐 Šaljem token za autentifikaciju...');
      socket.emit('client_token', TOKEN);
    }

    // Postavi status igrača
    socket.emit('player_status', 'available');
    
    // Sačekaj malo da se autentifikacija završi
    setTimeout(() => {
      console.log('📤 Šaljem challenge notifikaciju...');
      
      // Format podataka koji klijent očekuje (videti RoomContainer.tsx)
      const notificationData = {
        ch_uuid: CHALLENGE_DATA.ch_uuid,
        challenge_uuid: CHALLENGE_DATA.ch_uuid, // Alternativni format
        challenger_id: CHALLENGE_DATA.challenger_id,
        challenger_name: CHALLENGE_DATA.challenger_name,
        challengee_id: CHALLENGE_DATA.challengee_id,
        time_class: CHALLENGE_DATA.time_class,
        timeClass: CHALLENGE_DATA.timeClass,
        challenger: {
          id: CHALLENGE_DATA.challenger_id,
          name: CHALLENGE_DATA.challenger_name,
        },
      };

      // Pokušaj 1: Emituj direktno na 'tb_notification' event
      // (Server možda broadcast-uje svim povezanim korisnicima)
      console.log('\n📡 Pokušaj 1: Emitujem tb_notification...');
      socket.emit('tb_notification', notificationData);
      
      // Pokušaj 2: Emituj sa userId za direktno slanje određenom korisniku
      console.log('📡 Pokušaj 2: Emitujem send_notification sa userId...');
      socket.emit('send_notification', {
        userId: TARGET_USER_ID,
        notification: notificationData,
      });

      // Pokušaj 3: Emituj na room-specific event
      console.log('📡 Pokušaj 3: Emitujem na user-specific event...');
      socket.emit(`notification:${TARGET_USER_ID}`, notificationData);

      // Pokušaj 4: Emituj kao admin event
      console.log('📡 Pokušaj 4: Emitujem admin_send_notification...');
      socket.emit('admin_send_notification', {
        targetUserId: TARGET_USER_ID,
        notification: notificationData,
      });
      
      console.log('\n✅ Challenge notifikacije poslate!');
      console.log('📦 Podaci:', JSON.stringify(notificationData, null, 2));
      console.log('\n💡 Proverite konzolu u browser-u gde je otvoren link!');
      
      // Zatvori konekciju nakon 10 sekundi
      setTimeout(() => {
        console.log('\n🔌 Zatvaram konekciju...');
        socket.disconnect();
        process.exit(0);
      }, 10000);
    }, 2000);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket diskonektovan');
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Greška pri povezivanju:', error.message);
    process.exit(1);
  });

  // Slušaj odgovore sa servera
  socket.on('notification_sent', (data) => {
    console.log('📨 Odgovor sa servera (notification_sent):', data);
  });

  socket.on('notification_delivered', (data) => {
    console.log('📨 Odgovor sa servera (notification_delivered):', data);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket greška:', error);
  });

  // Slušaj i tb_notification da vidimo da li server broadcast-uje
  socket.on('tb_notification', (data) => {
    console.log('📨 Primljena tb_notification:', data);
  });
}

// Pokreni skriptu
sendChallengeNotification().catch((error) => {
  console.error('❌ Greška:', error);
  process.exit(1);
});