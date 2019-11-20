import React, { useContext } from 'react';
import UserlistStyle from './Userlist.style';
import MainContext from '../../Main.context';

const Userlist = () => {
  const { userlist } = useContext(MainContext);

  const UserComponents = userlist.map((user) => <div>{user}</div>);

  return <UserlistStyle>{UserComponents}</UserlistStyle>;
};

export default Userlist;
