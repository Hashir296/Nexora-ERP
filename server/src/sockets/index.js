function initSockets(io) {
  io.on('connection', (socket) => {
    socket.on('join', (room) => {
      if (room) socket.join(String(room));
    });

    socket.on('leave', (room) => {
      if (room) socket.leave(String(room));
    });

    socket.on('chat:typing', ({ room, user }) => {
      if (room) socket.to(String(room)).emit('chat:typing', { user });
    });

    socket.on('disconnect', () => {});
  });
}

module.exports = { initSockets };
