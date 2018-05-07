import * as request from "supertest";
import { } from "jasmine";
import { expect } from "chai";
import * as mongoose from "mongoose";

import * as app from "./app.mock";

describe("POST /api/create/app 200 OK", () => {
  beforeAll(() => {
    mongoose.Query.prototype.exec = () => {
      return new Promise((resolve, reject) => {
        resolve();
      });
    };
    mongoose.Collection.prototype.insert = (docs, options, cb) => {
      cb(null, docs);
    };
  });

  it("full data test", (done) => {
    const sObj = {
      author: "ABCD",
      name: "HRV Analytics",
      description: "This is a description."
    };

    return request(app).post("/api/create/app")
      .send(sObj)
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.key("app");
        expect(res.body.app).to.have.property("author", sObj.author);
        expect(res.body.app).to.have.property("name", sObj.name);
        expect(res.body.app).to.have.property("description", sObj.description);
        expect(res.body.app).to.include.keys("id");
        done();
      });
  });

  it("default data test", (done) => {
    const sObj = {
      author: "ABCD",
      name: "HRV Analytics"
    };
    return request(app).post("/api/create/app")
      .send(sObj)
      .expect(200)
      .end((err, res) => {
        expect(res.body).to.have.key("app");
        expect(res.body.app).to.have.property("author", sObj.author);
        expect(res.body.app).to.have.property("name", sObj.name);
        expect(res.body.app).to.have.property("description", "");
        expect(res.body.app).to.include.keys("id");
        done();
      });
  });
});


describe("POST /api/create/app 400 Bad Requst", () => {
  it("missing author", (done) => {
    const sObj = {
      name: "HRV Analytics",
      description: "This is a description."
    };

    return request(app).post("/api/create/app")
      .send(sObj)
      .expect(400, done);
  });

  it("missing name", (done) => {
    const sObj = {
      author: "ABCD",
      description: "This is a description."
    };

    return request(app).post("/api/create/app")
      .send(sObj)
      .expect(400, done);
  });

  it("wrong author type", (done) => {
    const sObj = {
      author: { },
      name: "HRV Analytics",
      description: "This is a description."
    };

    return request(app).post("/api/create/app")
      .send(sObj)
      .expect(400, done);
  });

  it("wrong name type", (done) => {
    const sObj = {
      author: "ABCD",
      name: { },
      description: "This is a description."
    };

    return request(app).post("/api/create/app")
      .send(sObj)
      .expect(400, done);
  });

  it("duplicate id error", (done) => {
    const sObj = {
      author: "ABCD",
      name: "HRV Analytics",
      description: "This is a description."
    };

    mongoose.Collection.prototype.insert = (docs, options, cb) => {
      cb({ name: "MongoError", code: 11000 }, null);
    };

    return request(app).post("/api/create/app")
      .send(sObj)
      .expect(400, done);
  });
});
