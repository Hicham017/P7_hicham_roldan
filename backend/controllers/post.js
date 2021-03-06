// Imports
var models   = require('../models');
var asyncLib = require('async');
var jwtUtils = require('../middleware/auth');

// Constants
const TITLE_LIMIT   = 2;
const CONTENT_LIMIT = 4;
const ITEMS_LIMIT   = 50;

// Routes
module.exports = {
  createMessage: function(req, res) {
    // Getting auth header
    var headerAuth  = req.headers['authorization'];
    var userId      = jwtUtils.getUserId(headerAuth);

    // Params
    var title   = req.body.title;
    var content = req.body.content;

    if (title == null || content == null) {
      return res.status(400).json({ 'error': 'missing parameters' });
    }

    if (title.length <= TITLE_LIMIT || content.length <= CONTENT_LIMIT) {
      return res.status(400).json({ 'error': 'invalid parameters' });
    }

    asyncLib.waterfall([
      function(done) {
        models.User.findOne({
          where: { id: userId }
        })
        .then(function(userFound) {
          done(null, userFound);
        })
        .catch(function(err) {
          return res.status(500).json({ 'error': 'unable to verify user' });
        });
      },
      function(userFound, done) {
        if(userFound) {
          models.Post.create({
            title  : title,
            content: content,
            likes  : 0,
            UserId : userFound.id
          })
          .then(function(newMessage) {
            done(newMessage);
          });
        } else {
          res.status(404).json({ 'error': 'user not found' });
        }
      },
    ], function(newMessage) {
      if (newMessage) {
        return res.status(201).json(newMessage);
      } else {
        return res.status(500).json({ 'error': 'cannot post message' });
      }
    });
  },
  listMessages: function(req, res) {
    var fields  = req.query.fields;
    var limit   = parseInt(req.query.limit);
    var offset  = parseInt(req.query.offset);
    var order   = req.query.order;

    if (limit > ITEMS_LIMIT) {
      limit = ITEMS_LIMIT;
    }

    models.Message.findAll({
      order: [(order != null) ? order.split(':') : ['title', 'ASC']],
      attributes: (fields !== '*' && fields != null) ? fields.split(',') : null,
      limit: (!isNaN(limit)) ? limit : null,
      offset: (!isNaN(offset)) ? offset : null,
      include: [{
        model: models.User,
        attributes: [ 'username' ]
      }]
    }).then(function(messages) {
      if (messages) {
        res.status(200).json(messages);
      } else {
        res.status(404).json({ "error": "no messages found" });
      }
    }).catch(function(err) {
      console.log(err);
      res.status(500).json({ "error": "invalid fields" });
    });
  }
}





























// //on importe le package fs de node
// const fs = require("fs");

// const express = require('express');
// const models = require("../models/index");

// //_________________________________________________________________________________________________________________________

// exports.createPost = (req, res, next) => {
//   // le body de la requ??te contient une cha??ne 'sauce', qui est un objet converti en cha??ne
//   // on l'analyse donc avec JSON.parse pour obtenir un objet utilisable

//   const postObject = JSON.parse(req.body.sauce);
//   //delete sauceObject._id;
//   const post = new Post({
//     ...postObject,

//     // on doit r??soudre l'URL compl??te de notre image, car req.file.filename ne contient que le segment filename
//     // on utilise req.protocol pour obtenier le 1er segment ('http')
//     // on ajoute '://', puis on utilise req.get('host') pour r??soudre l'h??te du serveur (localhost:3000)
//     // et on ajoute '/images/' et le nom de fichier pour compl??ter notre URL

//     imageUrl: `${req.protocol}://${req.get("host")}/images/${
//       req.file.filename
//     }`,
//   });
//   post
//     .save()
//     .then(() => res.status(201).json({ message: "Objet enregistr?? !" }))
//     .catch((error) => res.status(400).json({ error }));
// };

// //________________________________________________________________________________________________________________________

// // on cr??er uun objet sauceObject qui regarde si req.file existe ou non
// // s'il existe, on traite la nvelle img
// // sinon on traite simplement l'objet entrant
// exports.modifyPost = (req, res, next) => {
//   const postObject = req.file
//     ? {
//         ...JSON.parse(req.body.post),
   
//         imageUrl: `${req.protocol}://${req.get("host")}/images/${
//           req.file.filename
//         }`,
//       }
//     : { ...req.body };

//   //on cr??er ensuite une instance Sauce ?? p de sauceObject, puis on fait la modif
//   // 1 arg = comment trohver l'objet
//   // 2 dictionnairs
//   Post.updateOne(
//     { _id: req.params.id, userId : res.locals.userId }, 
//     { ...postObject, _id: req.params.id }
//   )
//     .then(() => res.status(200).json({ message: "Objet modifi?? !" }))
//     .catch((error) => res.status(400).json({ error 
//     }));
// };

// //_________________________________________________________________________________________________________________________

// //on r??impl??mente createSauce en important notre contr??lleur
// //et en enregistrant createSauce

// //_________________________________________________________________________________________________________________________

// exports.deletePost = (req, res, next) => {
//   // on utilise l'id qu'on re??oit comme param pour acc??der ?? la Sauce correspondante dans la b. de donn??es
//   Post.findOne({ _id: req.params.id })
//     .then((Posts) => {

//     //pb de s??cu ?? la supression
//       if (!Posts) {
//         res.status(401).json({ error: new Error('Sauce inexistante !')});
//       }

//       // comparer userID de la sauce
//       if (Posts.userId !== res.locals.userId) {
//         res.status(401).json({ error: new Error('Requ??te non autoris??e !')});
//       }
//       return Posts;
    
//     })
//     .then(Posts => {


//       // on utilise le fait de savoir que notre URL d'image contient un segment
//       // /images/ pour s??parer le nom de fichier
//       const filename = Posts.imageUrl.split("/images/")[1];

//       // on utilise la f?? UNLINK de package fs pour suppr ce fichier, en lui passant le fichier ?? suppr
//       // et le callback ?? ex??cuter une fois ce fichier suppr
//       fs.unlink(`images/${filename}`, () => {
//         //dans cette callback, on impl??mente la logique d'origine, en supprimant la Sauce de la b. de donn??es
//         Post.deleteOne({ _id: req.params.id })
//           .then(() => res.status(200).json({ message: "Objet supprim?? !" }))
//           .catch((error) => res.status(400).json({ error }));
//       });
//      })
//     .catch(error => res.status(500).json({ error }));

// };

// //_________________________________________________________________________________________________________________________

// exports.getOnePost = (req, res, next) => {
//   Post.findOne({
//     _id: req.params.id,
//   })
//     .then((sauce) => {
//       res.status(200).json(sauce);
//     })
//     .catch((error) => {
//       res.status(401).json({
//         error: error,
//       });
//     });
// };

// //_________________________________________________________________________________________________________________________

// //_________________________________________________________________________________________________________________________

// exports.getAllPosts = (req, res, next) => {
//   Post.find()
//     .then((post) => {
//       res.status(200).json(post);
//     })
//     .catch((error) => {
//       res.status(400).json({
//         error: error,
//       });
//     });
// };

// //___________________________________________________________________________________________________________

// exports.likePost = (req, res, next) => {
//    Post.findOne({ _id: req.params.id }).then((post) => {
//     // verif si on est sur du like dislike ou ann??
//     // si c un like, on verif si req.body.userid est dans userLiked
//     if (req.body.like == 1 && !post.usersLiked.includes(req.body.userId)) {
//       Post.updateOne(
//         { _id: req.params.id },
//         {
//           $inc: { likes: +1 }, //ajout du like
//           $push: { usersLiked: req.body.userId },
//         }
//       )

//         .then(() => res.status(200).json({ message: "Objet modifi?? !" }))
//         .catch((error) => res.status(400).json({ error }));
//     } else if (
//       req.body.like == - 1 &&
//       !post.usersDisliked.includes(req.body.userId)
//     ) {
//       post.updateOne(
//         { _id: req.params.id },
//         {
//           $inc: { dislikes: +1 },
//           $push: { usersDisliked: req.body.userId },
//         }
//       )

//         .then(() => res.status(200).json({ message: "Objet modifi?? !" }))
//         .catch((error) => res.status(400).json({ error }));
//     } else {
//       if (post.usersDisliked.includes(req.body.userId)) {
//         console.log('toto');
//         Post.updateOne(
//           { _id: req.params.id },
//           {
//             $inc: { dislikes: -1 },
//             $pull: { usersDisliked: req.body.userId },
//           }
//         )

//           .then(() => res.status(200).json({ message: "Objet modifi?? !" }))
//           .catch((error) => res.status(400).json({ error }));
//       } else if (post.usersLiked.includes(req.body.userId)) {
//         console.log('ok');
//         Post.updateOne(
//           { _id: req.params.id },
//           {
//             $inc: { likes: - 1 },
//             $pull: { usersLiked: req.body.userId },
//           }
//         )

//           .then(() => res.status(200).json({ message: "Objet modifi?? !" }))
//           .catch((error) => res.status(400).json({ error }));
//       }
//     }
//   });
// };

// // sinon 121 130
// // si c un dislike on verif si """" est dans user disliked
// // sinon 121 130 en changeant like en
