const Sequelize = require('sequelize');

const { Op } = Sequelize;

module.exports = {
  Query: {
    friends: (obj, { pFriendId }, { Friends, Users }) => {
      return Users.findAll({
        type: Sequelize.QueryTypes.SELECT,
        include: [
          {
            model: Friends,
            where: {
              [Op.and]: [
                { sFriendId: Sequelize.col('Users.id') },
                { pFriendId: pFriendId },
              ],
            },
          },
        ],
      });
    },
    deleteFriend: async (obj, { id, nickname }, { Friends, Users }) => {
      const idFromNicknames = await Users.findAll({
        where: { nickname: nickname },
      });
      const conditionColumns = {
        where: {
          [Op.or]: [
            {
              [Op.and]: [
                { pFriendId: idFromNicknames.map((acc) => acc.dataValues.id) },
                { sFriendId: id },
              ],
            },
            {
              [Op.and]: [
                { sFriendId: idFromNicknames.map((acc) => acc.dataValues.id) },
                { pFriendId: id },
              ],
            },
          ],
        },
      };

      await Friends.destroy(conditionColumns);
      return Friends.findAll(conditionColumns);
    },
    addFriendForTest: (obj, args, { Friends }) => {
      Friends.create({ pFriendId: 1, sFriendId: 2 }).then({}, (err) => {
        console.log('already exists');
      });
      Friends.create({ pFriendId: 2, sFriendId: 1 }).then({}, (err) => {
        console.log('already exists');
      });
      return Friends.findAll({
        where: {
          [Op.or]: [
            { [Op.and]: [{ pFriendId: 1 }, { sFriendId: 2 }] },
            { [Op.and]: [{ pFriendId: 2 }, { sFriendId: 1 }] },
          ],
        },
      });
    },
  },
};
