// Retruco-API -- HTTP API to bring out shared positions from argumented statements
// By: Paula Forteza <paula@retruco.org>
//     Emmanuel Raviart <emmanuel@retruco.org>
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


import {db} from "../database"
import {entryToProperty, getObjectFromId, toDataJson, wrapAsyncMiddleware} from "../model"
import {getIdFromIdOrSymbol} from "../symbols"


export const getObject = wrapAsyncMiddleware(async function getObject(req, res) {
  let show = req.query.show || []
  res.json({
    apiVersion: "1",
    data: await toDataJson(req.object, req.authenticatedUser, {
      depth: req.query.depth || 0,
      showBallots: show.includes("ballots"),
      showProperties: show.includes("properties"),
      showReferences: show.includes("references"),
      showValues: show.includes("values"),
    }),
  })
})


export const listObjectSameKeyProperties = wrapAsyncMiddleware(async function listObjectSameKeyProperties(req, res) {
  let objectId = req.object.id
  let show = req.query.show || []

  let keyId = getIdFromIdOrSymbol(req.params.keyIdOrSymbol)
  if (!keyId) {
    res.status(404)
    res.json({
      apiVersion: "1",
      code: 404,
      message: `No object with symbol "${req.params.keyIdOrSymbol}".`,
    })
    return
  }
  let typedKey = await getObjectFromId(keyId)
  if (typedKey === null) {
    res.status(404)
    res.json({
      apiVersion: "1",
      code: 404,
      message: `No object with ID or symbol "${req.params.keyIdOrSymbol}".`,
    })
    return
  }

  let sameKeyProperties = (await db.any(
    `
      SELECT objects.*, statements.*, properties.*, symbol
      FROM objects
      INNER JOIN statements ON objects.id = statements.id
      INNER JOIN properties ON statements.id = properties.id
      LEFT JOIN symbols ON properties.id = symbols.id
      WHERE properties.object_id = $<objectId>
      AND properties.key_id = $<keyId>
      ORDER BY rating DESC, created_at DESC
    `,
    {
      keyId,
      objectId,
    },
  )).map(entryToProperty)

  res.json({
    apiVersion: "1",
    data: await toDataJson(sameKeyProperties, req.authenticatedUser, {
      depth: req.query.depth || 0,
      showBallots: show.includes("ballots"),
      showProperties: show.includes("properties"),
      showReferences: show.includes("references"),
      showValues: show.includes("values"),
    }),
  })
})


export const requireObject = wrapAsyncMiddleware(async function requireObject(req, res, next) {
  let id = getIdFromIdOrSymbol(req.params.idOrSymbol)
  if (!id) {
    res.status(404)
    res.json({
      apiVersion: "1",
      code: 404,
      message: `No object with symbol "${req.params.idOrSymbol}".`,
    })
    return
  }
  let object = await getObjectFromId(id)
  if (object === null) {
    res.status(404)
    res.json({
      apiVersion: "1",
      code: 404,
      message: `No object with ID or symbol "${req.params.idOrSymbol}".`,
    })
    return
  }
  req.object = object

  return next()
})
