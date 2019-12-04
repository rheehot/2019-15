import React, { useContext } from 'react';
import FullScreen from './GameLoading.style';
import Loading from '../globalComponents/Loading/Loading';
import GamePlayContext from 'pages/GamePlay/GamePlay.context';

export default function GameLoading() {
  const { userList } = useContext(GamePlayContext);

  if (userList.length <= 1) {
    return (
      <FullScreen>
        <Loading />
      </FullScreen>
    );
  }

  return <></>;
}
