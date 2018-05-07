import * as request from "supertest";
import { } from "jasmine";
import { expect } from "chai";
import * as mongoose from "mongoose";

import * as app from "./app.mock";
import { default as Application } from "../src/models/Application";

describe("POST /api/create/algorithm 200 OK", () => {
  const dbObject: any = {
    author: "ABC",
    name: "A name",
    description: "A description",
    algorithms: []
  };

  beforeAll(() => {
    mongoose.Query.prototype.exec = () => {
      return new Promise((resolve, reject) => {
        resolve(new Application(dbObject));
      });
    };
    mongoose.Collection.prototype.insert = (docs, options, cb) => {
      cb(null, docs);
    };
  });

  it("full data test", (done) => {
    const sObj = {
      version: "1.0",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5",
      description: "This is a description."
    };

    return request(app).post("/api/create/algorithm")
      .send(sObj)
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.key("app");
        expect(res.body.app).to.have.property("id", sObj.app_id);
        expect(res.body.app).to.include.keys("algorithms");
        expect(res.body.app.algorithms[0]).to.have.property("version", sObj.version);
        expect(res.body.app.algorithms[0]).to.have.property("description", sObj.description);
        expect(res.body.app.algorithms[0]).to.include.keys("files", "parameters");
        done();
      });
  });

  it("default data test", (done) => {
    const sObj = {
      version: "1",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5"
    };

    return request(app).post("/api/create/algorithm")
      .send(sObj)
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.key("app");
        expect(res.body.app).to.have.property("id", sObj.app_id);
        expect(res.body.app).to.include.keys("algorithms");
        expect(res.body.app.algorithms[0]).to.have.property("version", sObj.version);
        expect(res.body.app.algorithms[0]).to.not.have.property("description");
        expect(res.body.app.algorithms[0]).to.include.keys("files", "parameters");
        done();
      });
  });
});



describe("POST /api/create/algorithm 400 Bad Request", () => {
  const dbObject: any = {
    author: "ABC",
    name: "A name",
    description: "A description",
    algorithms: []
  };

  beforeAll(() => {
    mongoose.Query.prototype.exec = () => {
      return new Promise((resolve, reject) => {
        resolve(new Application(dbObject));
      });
    };
    mongoose.Collection.prototype.insert = (docs, options, cb) => {
      cb(null, docs);
    };
  });

  it("bad description", (done) => {
    const sObj = {
      version: "1",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5",
      description: {}
    };

    return request(app).post("/api/create/algorithm")
      .send(sObj)
      .expect(400, done);
  });

  it("bad version", (done) => {
    const sObj = {
      version: [],
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5"
    };

    return request(app).post("/api/create/algorithm")
      .send(sObj)
      .expect(400, done);
  });

  it("No app created", (done) => {
    mongoose.Query.prototype.exec = () => {
      return new Promise((resolve, reject) => {
        resolve();
      });
    };

    const sObj = {
      version: "1",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5"
    };

    return request(app).post("/api/create/algorithm")
      .send(sObj)
      .expect(400, done);
  });

  it("duplicate version", (done) => {
    dbObject.algorithms.push({
      version: "1"
    });
    mongoose.Query.prototype.exec = () => {
      return new Promise((resolve, reject) => {
        resolve(dbObject);
      });
    };

    const sObj = {
      version: "1",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5"
    };

    return request(app).post("/api/create/algorithm")
      .send(sObj)
      .expect(400, done);
  });
});
