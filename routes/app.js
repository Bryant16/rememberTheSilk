const express = require('express');
const { check, validationResult } = require('express-validator');
const db = require('../db/models');
const { List, Task, User, ListandTask } = db;
const { csrfProtection, asyncHandler } = require('../utils');
const { requireAuth } = require('../auth');
const { Op } = require("sequelize");

const router = express.Router();

const listValidators = [
    check("name")
      .exists({ checkFalsy: true })
      .withMessage("List does not exisit"),
  ]
  const listNotFoundError = (id) => {
    const err = Error('List not found');
    err.errors = [`List with id of ${id} could not be found.`];
    err.title = 'List not found.';
    err.status = 404;
    return err;
  };
router.use(requireAuth);

router.get('/', csrfProtection, asyncHandler(async(req, res, next)=>{
  const id = parseInt(req.session.auth.userId, 10);
  const user = await User.findByPk(id);
  const allLists = await List.findAll({
    where: {userId: id},
    include: [Task]
  });

    res.render('app', { list: allLists[0], user, allLists, allTasks: allLists[0] })
}));

router.get('/:id', asyncHandler(async(req, res, next) => {
  const id = parseInt(req.params.id);
  const user = parseInt(req.session.auth.userId, 10);
  const list = await List.findByPk(id, {
    include: [Task]
  })
  const allLists = await List.findAll({
    where: { userId: user }
  });

  res.render('app', { list, allLists, allTasks: list });
}))

router.post('/tasks', asyncHandler(async (req,res, next) => {

  const id = parseInt(req.body.listId, 10);

  const list = await List.findByPk(id, {
    include: [Task]
  });
  const newTask = await Task.create({ name: req.body.task});
  const joined = await ListandTask.create({ listId: id , taskId: newTask.id})

    res.json({ newTask });
}))

router.get('/lists:id(\\d+)', asyncHandler(async(req, res)=>{
    const id = parseInt(req.params.id, 10);
    const list = await List.findByPk(id);
    if(list){
         res.json({list})
    }else{
        next(listNotFoundError(id))
    }
}));

router.delete('/tasks', asyncHandler(async (req, res) => {
    const itemsToDelete = req.body.selectedItems;

    let taskName = itemsToDelete[itemsToDelete.length-1]
    while(itemsToDelete.length) {
      const task = await Task.findAll({
        where:{name: taskName}
      })

      await ListandTask.destroy({
        where: {
          taskId: task[0].id
        }
      })
      await Task.destroy({
        where: {
          id: task[0].id
        }
      })
      itemsToDelete.pop();
    }
    res.json()

  }))


router.post('/lists', asyncHandler(async(req, res)=>{
  const id = parseInt(req.session.auth.userId, 10);
  const list = await List.create({ name: req.body.list, userId: id });
  const allLists = await List.findAll({
    where:{userId: id}
  });
  res.redirect(`/app/${list.id}`)

}));

router.post('/search', asyncHandler(async (req, res) => {
  const value = req.body.searchTerm;
  const id = parseInt(req.session.auth.userId, 10);
  let allTasks;

  if(value) {
    allTasks = await Task.findAll({
      through: {
        model: List,
        where: { userId: id }
      },
      where: {
        name: { [Op.iLike]: `%${value}%` }
      }
    })

  }

   res.json({ allTasks })
}))

module.exports = router;
