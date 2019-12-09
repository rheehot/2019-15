import socketIo from 'socket.io-client';
import APP_URI from 'util/uri';

export const connectSocket = () => {
  return socketIo.connect(`${APP_URI.REACT_APP_API_URI}/online`);
};

export const onRequestFriend = (socket, alarmListDispatch) => {
  socket.on('requestFriend', (user) => {
    alarmListDispatch({
      type: 'push',
      value: `${user.nickname}님이 친구가 되고 싶어 해요`,
    });
  });
};

export const offRequestFriend = (socket) => {
  socket.off('requestFriend');
};

export const emitRequestFriend = (socket, receiver) => {
  socket.emit('requestFriend', receiver);
};

export const onFriendsOnline = (socket, onlineFriendsDispatch) => {
  socket.on('friendsOnline', (friends) => {
    onlineFriendsDispatch({ type: 'add', value: friends });
  });
};

export const offFriendsOnline = (socket) => {
  socket.off('friendsOnline');
};

export const onFriendOffline = (socket, onlineFriendsDispatch) => {
  socket.on('friendOffline', (friend) => {
    onlineFriendsDispatch({ type: 'delete', value: friend });
  });
};

export const offFriendOffline = (socket) => {
  socket.off('friendOffline');
};

export const emitAcceptFriendRequest = (socket, friend) => {
  socket.emit('acceptFriendRequest', friend);
};

export const emitDeleteFriend = (socket, friend) => {
  socket.emit('deleteFriend', friend);
};
