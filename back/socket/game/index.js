const { personEnterPrivateRoom, sendUserListToRoom } = require('./game');
const { RoomManager } = require('../RoomManager');
const sendGameImage = require('./gameImage');
const { enterRandom, enterPrivate } = require('./enterGame');
const { sendMessage } = require('./message');
const selectWord = require('./selectWord');
const { PRIVATE_ROOM_NAME } = require('../../config/roomConfig');
const { startPrivateGame } = require('./startPrivateGame');
const exitRoom = require('./exitRoom');

function setGameSocket(socket) {
  this.RoomManager = RoomManager;
  const roomInfo = {};
  const gameSocket = socket;

  socket.on('enterRandom', ({ nickname, roomType, avatar }) => {
    roomInfo.roomType = roomType;
    roomInfo.roomId = RoomManager.getEnableRoomId(roomType, this.gameIo);
  });

  socket.on('makePrivate', ({ roomId }) => {
    this.RoomManager.addRoom(PRIVATE_ROOM_NAME, this.gameIo, roomId);
    this.RoomManager.room[PRIVATE_ROOM_NAME][roomId].roomOwner = gameSocket.id;
  });

  socket.on('enterPrivate', ({ nickname, roomId, avatar }) => {
    roomInfo.roomType = PRIVATE_ROOM_NAME;
    roomInfo.roomId = roomId;
  });

  socket.on('exitRoom', exitRoom.bind(this, gameSocket));
  socket.on('startPrivateGame', startPrivateGame.bind(this, gameSocket));
  socket.on('enterPrivate', enterPrivate.bind(this, gameSocket));
  socket.on('selectWord', selectWord.bind(this, gameSocket));
  socket.on('sendMessage', sendMessage.bind(this, gameSocket));
  socket.on('enterRandom', enterRandom.bind(this, gameSocket, roomInfo));
  socket.on('drawing', sendGameImage.bind(this, gameSocket));
  socket.on('disconnect', () => {
    if (!roomInfo) return;
    if (!RoomManager.isExistRoom(roomInfo)) return;

    const { roomType, roomId } = roomInfo;
    const room = RoomManager.room[roomType][roomId];
    const userIdx = room.getUserIndexBySocketId(gameSocket);
    if (userIdx >= 0) {
      // 방 상태 변경
      if (room.players.length <= 2) room.initRoomState();

      // 방에 있는 플레이어 업데이트
      const resultCode = room.removePlayer(userIdx);
      sendUserListToRoom(room.players, roomId, this.gameIo);
      gameSocket.leave();

      if (resultCode === 1) {
        room.timer.stop();
        gameSocket.in(roomId).emit('prepareNewGame');
      }
      if (resultCode === 2) gameSocket.to(roomId).emit('gamestart', room.makeGameStartData());
      if (resultCode === 3) room.questionEndCallback(gameSocket);
      if (resultCode === 4) {
        if (room.isAllPlayerAnswered()) room.questionEndCallback(gameSocket);
      }
    }

    if (gameSocket.id === room.roomOwner) {
      room.passRoomOwnerToNext();
      sendUserListToRoom(room.players, roomId, this.gameIo);
    }

    if (roomType !== PRIVATE_ROOM_NAME && room.players.length < 1) {
      RoomManager.deleteRoom(roomType, roomId);
    }
    if (roomType === PRIVATE_ROOM_NAME && room.players.length < 1) {
      room.timer.stop();
    }
  });
}

module.exports = setGameSocket;
