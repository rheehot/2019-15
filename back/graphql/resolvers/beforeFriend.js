const Sequelize = require('sequelize');

const { Op } = Sequelize;
const { getPageResult, getEdgesFromNodes } = require('../../util/graphql/cursor');

const friendResolvers = {
  Query: {
    beforeFriends: async (obj, { first, after }, { Users, BeforeFriends, req }) => {
      const afterClause = after
        ? {
            id: {
              [Op.gt]: after,
            },
          }
        : {};
      const nodes = await BeforeFriends.findAll({
        where: {
          [Op.and]: [
            {
              sFriendId: req.user.id,
            },
            { friendStateId: 1 },
            afterClause,
          ],
        },
        include: [
          {
            model: Users,
            as: 'pFriend',
          },
        ],
        limit: first,
        order: [['id']],
      });

      const edges = getEdgesFromNodes(nodes, (node) => node.id);
      return getPageResult(edges, first);
    },
  },
  Mutation: {
    deleteFriendRequest: async (obj, { id }, { BeforeFriends, req }) => {
      const count = await BeforeFriends.destroy({
        where: {
          [Op.and]: [{ pFriendId: id }, { sFriendId: req.user.id }],
        },
      });
      if (!count) {
        throw new Error('해당 친구 요청이 없습니다.');
      }
      return { id };
    },
    acceptFriendRequest: async (obj, { id }, { BeforeFriends, Friends, req, sequelize }) => {
      let transaction;
      try {
        transaction = await sequelize.transaction();
        await Friends.bulkCreate(
          [{ pFriendId: id, sFriendId: req.user.id }, { pFriendId: req.user.id, sFriendId: id }],
          { transaction },
        );
        await BeforeFriends.update(
          { friendStateId: 2 },
          {
            where: {
              [Op.and]: [{ pFriendId: id }, { sFriendId: req.user.id }],
            },
          },
          { transaction },
        );
        await transaction.commit();
        return {
          id,
        };
      } catch (e) {
        console.log(e);
        if (transaction) await transaction.rollback();
        throw new Error(`에러로 인해 친구가 되지 못하였습니다.`);
      }
    },

    sendFriendRequest: async (obj, { nickname }, { Friends, BeforeFriends, Users, req }) => {
      const friend = await Users.findOne({
        where: { nickname: nickname },
      });
      if (!friend) throw new Error(`${nickname}님은 유저가 아닙니다.`);

      const isFriend = await Friends.findAll({
        where: {
          pFriendId: req.user.id,
          sFriendId: friend.dataValues.id,
        },
      });

      if (isFriend.length) throw new Error(`${nickname}님과는 이미 친구입니다.`);

      try {
        await BeforeFriends.create({
          pFriendId: req.user.id,
          sFriendId: friend.dataValues.id,
          friendStateId: 1,
        });
      } catch (e) {
        console.log(e);
        if (e.message === 'Validation error') {
          throw new Error(`${nickname}님 에게는 이미 친구 신청을 하였습니다.`);
        }
      }
      return {
        id: friend.dataValues.id,
        nickname,
      };
    },
  },
};

module.exports = friendResolvers;
