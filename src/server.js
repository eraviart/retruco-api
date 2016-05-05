// Retruco-API -- HTTP API to bring out shared positions from argumented statements
// By: Paula Forteza <paula@gouv2.fr>
//     Emmanuel Raviart <emmanuel@gouv2.fr>
//
// Copyright (C) 2016 Paula Forteza & Emmanuel Raviart
// https://git.framasoft.org/retruco/retruco-api
//
// Retruco-API is free software; you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// Retruco-API is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.


import bodyParserFactory from "koa-bodyparser"
import convert from "koa-convert"
import corsFactory from "koa-cors"
import http from "http"
import Koa from "koa"
import routerFactory from "koa-router"
import swaggerValidatorFactory from "koa-swagger"

import config from "./config"
import {checkDatabase} from "./database"
import * as abusesController from "./controllers/abuses"
import * as argumentsController from "./controllers/arguments"
import * as ratingsController from "./controllers/ratings"
import * as statementsController from "./controllers/statements"
import * as swaggerController from "./controllers/swagger"
import * as usersController from "./controllers/users"


checkDatabase()
  .then(startKoa)
  .catch(console.log.bind(console))


let bodyParser = bodyParserFactory()

// Patch Swagger spec, because ko-swagger uses :xxx instead of {xxx} for parameters in path.
// See https://github.com/rricard/koa-swagger/issues/2.
let patchedSwaggerSpec = {...swaggerController.SPEC}
let paths = {}
for (let path in patchedSwaggerSpec.paths) {
  paths[path.replace(/\/\{/g, "/:").replace(/\}/g, "")] = patchedSwaggerSpec.paths[path]
}
patchedSwaggerSpec.paths = paths
let swaggerValidator = convert(swaggerValidatorFactory(patchedSwaggerSpec))

let router = routerFactory()

router.get("/statements", swaggerValidator, statementsController.listStatements)
router.post("/statements", bodyParser, swaggerValidator, usersController.authenticate(true),
  statementsController.createStatement)
router.delete("/statements/:statementId", swaggerValidator, usersController.authenticate(true),
  statementsController.requireStatement, statementsController.deleteStatement)
router.get("/statements/:statementId", swaggerValidator, usersController.authenticate(false),
  statementsController.requireStatement, statementsController.getStatement)

router.get("/statements/:statementId/abuse", swaggerValidator, usersController.authenticate(false),
  statementsController.requireStatement, abusesController.requireAbuse, statementsController.getStatement)
router.delete("/statements/:statementId/abuse/rating", swaggerValidator, usersController.authenticate(true),
  statementsController.requireStatement, abusesController.requireAbuse, ratingsController.deleteRating)
router.get("/statements/:statementId/abuse/rating", swaggerValidator, usersController.authenticate(true),
  statementsController.requireStatement, abusesController.requireAbuse, ratingsController.getRating)
router.post("/statements/:statementId/abuse/rating", bodyParser, swaggerValidator, usersController.authenticate(true),
  statementsController.requireStatement, abusesController.requireAbuse, ratingsController.upsertRating)

router.get("/statements/:statementId/arguments/:groundId", swaggerValidator, usersController.authenticate(false),
  statementsController.requireStatement, argumentsController.requireArgument, statementsController.getStatement)
router.delete("/statements/:statementId/arguments/:groundId/rating", swaggerValidator,
  usersController.authenticate(true), statementsController.requireStatement, argumentsController.requireArgument,
  ratingsController.deleteRating)
router.get("/statements/:statementId/arguments/:groundId/rating", swaggerValidator, usersController.authenticate(true),
  statementsController.requireStatement, argumentsController.requireArgument, ratingsController.getRating)
router.post("/statements/:statementId/arguments/:groundId/rating", bodyParser, swaggerValidator,
  usersController.authenticate(true), statementsController.requireStatement, argumentsController.requireArgument,
  ratingsController.upsertRating)

router.delete("/statements/:statementId/rating", swaggerValidator, usersController.authenticate(true),
  statementsController.requireStatement, ratingsController.deleteRating)
router.get("/statements/:statementId/rating", swaggerValidator, usersController.authenticate(true),
  statementsController.requireStatement, ratingsController.getRating)
router.post("/statements/:statementId/rating", bodyParser, swaggerValidator, usersController.authenticate(true),
  statementsController.requireStatement, ratingsController.upsertRating)

router.post("/login", bodyParser, swaggerValidator, usersController.login)

router.get("/swagger.json", swaggerController.getSwagger)

router.get("/users", swaggerValidator, usersController.listUsersUrlName)
router.post("/users", bodyParser, swaggerValidator, usersController.createUser)
// router.put("/users", bodyParser, swaggerValidator, usersController.updateUser)
router.delete("/users/:userName", swaggerValidator, usersController.requireUser, usersController.authenticate(true),
  usersController.deleteUser)
router.get("/users/:userName", swaggerValidator, usersController.requireUser, usersController.authenticate(false),
  usersController.getUser)
// router.patch("/users/:userName", swaggerValidator, usersController.requireUser, usersController.patchUser)

let app = new Koa()
app.keys = config.keys
app.name = config.title
app.proxy = config.proxy
app
  .use(async function (ctx, next) {
    // Error handling middleware
    try {
      await next()
    } catch (e) {
      ctx.status = e.status || 500
      ctx.body = {
        apiVersion: "1",
        code: 500,
        message: e.message || http.STATUS_CODES[ctx.status],
      }
      ctx.app.emit("error", e, ctx)
    }
  })
  .use(convert(corsFactory()))
  .use(router.routes())
  .use(router.allowedMethods())


function startKoa() {
  let host = config.listen.host
  let port = config.listen.port || config.port
  app.listen(port, host)
  console.log(`Listening on ${host || "*"}:${port}...`)
}
