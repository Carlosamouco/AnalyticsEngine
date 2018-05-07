import * as request from "supertest";
import { } from "jasmine";
import { expect } from "chai";
import * as mongoose from "mongoose";

import * as app from "./app.mock";
import { default as Application } from "../src/models/Application";

describe("POST /api/create/parameters 200 OK", () => {
  const dbObject: any = {
    author: "ABC",
    name: "A name",
    description: "A description",
    algorithms: [{
      id: "777d45bbbcdf50d49c42c70ad7acf5fe",
      version: "1.0",
      files: ["teste.js"]
    }]
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

  it("default/full data test  w/ flag", (done) => {
    const sObj = {
      version_id: "777d45bbbcdf50d49c42c70ad7acf5fe",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5",
      entryApp: {
        appName: "node"
      },
      parameters: [{
        name: "arg0"
      },
      {
        name: "arg1",
        description: "Entry File",
        type: "0",
        flag: "-f",
        options: {
          static: "false",
          required: "true",
          localFile: "true",
          nArgs: {
            max: 2,
            min: 1,
          },
          defaultArgs: ["teste.js"]
        }
      }]
    };

    return request(app).post("/api/create/parameters")
      .send(sObj)
      .expect(200)
      .end((err, res) => {
        const algorithm = res.body.app.algorithms[0];
        console.log(JSON.stringify(algorithm));
        expect(algorithm).to.have.property("parameters");
        expect(algorithm.parameters.length).to.be.equal(2);
        expect(algorithm.parameters[0]).to.be.deep.equal(
          {
            options: {
              nArgs: { min: 1 },
              static: false,
              required: false,
              localFile: false
            },
            name: "arg0",
            type: "0",
            position: 0
          });

        expect(algorithm.parameters[1]).to.be.deep.equal(
          {
            options: {
              nArgs: { min: 1, max: 2 },
              static: false,
              required: true,
              localFile: true,
              defaultArgs: ["teste.js"],
            },
            name: "arg1",
            type: "0",
            flag: "-f",
            description: "Entry File",
            position: 1
          });
        done();
      });
  });
  it("static no args", (done) => {
    const sObj = {
      version_id: "777d45bbbcdf50d49c42c70ad7acf5fe",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5",
      entryApp: {
        appName: "node"
      },
      parameters: [
        {
          name: "arg0",
          flag: "-f",
          options: {
            static: "true"
          }
        }]
    };

    return request(app).post("/api/create/parameters")
      .send(sObj)
      .expect(200, done);
  });
});



describe("POST /api/create/parameters 400 Bad Request", () => {
  const dbObject: any = {
    author: "ABC",
    name: "A name",
    description: "A description",
    algorithms: [{
      id: "777d45bbbcdf50d49c42c70ad7acf5fe",
      version: "1.0",
      files: ["teste.js"]
    }]
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

  it("undefined file", (done) => {
    const sObj = {
      version_id: "777d45bbbcdf50d49c42c70ad7acf5fe",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5",
      entryApp: {
        appName: "node"
      },
      parameters: [
        {
          name: "arg1",
          options: {
            localFile: "true",
            defaultArgs: ["testes.js"]
          }
        }]
    };

    return request(app).post("/api/create/parameters")
      .send(sObj)
      .expect(400, done);
  });

  it("invalide default args", (done) => {
    const sObj = {
      version_id: "777d45bbbcdf50d49c42c70ad7acf5fe",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5",
      entryApp: {
        appName: "node"
      },
      parameters: [
        {
          options: {
            nArgs: { max: 1 },
            defaultArgs: ["val0", "val1"],
          },
          name: "arg0",
        }]
    };

    return request(app).post("/api/create/parameters")
      .send(sObj)
      .expect(400, done);
  });

  it("invalide nArgs.max val", (done) => {
    const sObj = {
      version_id: "777d45bbbcdf50d49c42c70ad7acf5fe",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5",
      entryApp: {
        appName: "node"
      },
      parameters: [
        {
          options: {
            nArgs: { max: 0 }
          },
          name: "arg0",
        }]
    };

    return request(app).post("/api/create/parameters")
      .send(sObj)
      .expect(400, done);
  });

  it("static must require default args", (done) => {
    const sObj = {
      version_id: "777d45bbbcdf50d49c42c70ad7acf5fe",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5",
      entryApp: {
        appName: "node"
      },
      parameters: [
        {
          options: {
            static: "true"
          },
          name: "arg0",
        }]
    };

    return request(app).post("/api/create/parameters")
      .send(sObj)
      .expect(400, done);
  });

  it("wrong data types", (done) => {
    const sObj = {
      version_id: "777d45bbbcdf50d49c42c70ad7acf5fe",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5",
      entryApp: {
        appName: "node"
      },
      parameters: [
        {
          options: [],
          name: "arg0"
        }]
    };

    return request(app).post("/api/create/parameters")
      .send(sObj)
      .expect(400, done);
  });
  it("no name", (done) => {
    const sObj = {
      version_id: "777d45bbbcdf50d49c42c70ad7acf5fe",
      app_id: "abe3b9c1b8e47379e0b3d2d28b88f3a5",
      entryApp: {
        appName: "node"
      },
      parameters: [
        {
          name: ""
        }]
    };

    return request(app).post("/api/create/parameters")
      .send(sObj)
      .expect(400, done);
  });
});
