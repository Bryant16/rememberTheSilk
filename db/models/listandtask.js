'use strict';
module.exports = (sequelize, DataTypes) => {
  const ListandTask = sequelize.define('ListandTask', {
    listId: {
      type: DataTypes.INTEGER,},
    taskId: DataTypes.INTEGER
  }, {});
  ListandTask.associate = function(models) {
    // associations can be defined here
  };
  return ListandTask;
};
