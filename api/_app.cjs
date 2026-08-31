var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/file-uri-to-path/index.js
var require_file_uri_to_path = __commonJS({
  "node_modules/file-uri-to-path/index.js"(exports2, module2) {
    var sep = require("path").sep || "/";
    module2.exports = fileUriToPath;
    function fileUriToPath(uri) {
      if ("string" != typeof uri || uri.length <= 7 || "file://" != uri.substring(0, 7)) {
        throw new TypeError("must pass in a file:// URI to convert to a file path");
      }
      var rest = decodeURI(uri.substring(7));
      var firstSlash = rest.indexOf("/");
      var host = rest.substring(0, firstSlash);
      var path3 = rest.substring(firstSlash + 1);
      if ("localhost" == host) host = "";
      if (host) {
        host = sep + sep + host;
      }
      path3 = path3.replace(/^(.+)\|/, "$1:");
      if (sep == "\\") {
        path3 = path3.replace(/\//g, "\\");
      }
      if (/^.+\:/.test(path3)) {
      } else {
        path3 = sep + path3;
      }
      return host + path3;
    }
  }
});

// node_modules/bindings/bindings.js
var require_bindings = __commonJS({
  "node_modules/bindings/bindings.js"(exports2, module2) {
    var fs3 = require("fs");
    var path3 = require("path");
    var fileURLToPath = require_file_uri_to_path();
    var join = path3.join;
    var dirname = path3.dirname;
    var exists = fs3.accessSync && function(path4) {
      try {
        fs3.accessSync(path4);
      } catch (e) {
        return false;
      }
      return true;
    } || fs3.existsSync || path3.existsSync;
    var defaults = {
      arrow: process.env.NODE_BINDINGS_ARROW || " \u2192 ",
      compiled: process.env.NODE_BINDINGS_COMPILED_DIR || "compiled",
      platform: process.platform,
      arch: process.arch,
      nodePreGyp: "node-v" + process.versions.modules + "-" + process.platform + "-" + process.arch,
      version: process.versions.node,
      bindings: "bindings.node",
      try: [
        // node-gyp's linked version in the "build" dir
        ["module_root", "build", "bindings"],
        // node-waf and gyp_addon (a.k.a node-gyp)
        ["module_root", "build", "Debug", "bindings"],
        ["module_root", "build", "Release", "bindings"],
        // Debug files, for development (legacy behavior, remove for node v0.9)
        ["module_root", "out", "Debug", "bindings"],
        ["module_root", "Debug", "bindings"],
        // Release files, but manually compiled (legacy behavior, remove for node v0.9)
        ["module_root", "out", "Release", "bindings"],
        ["module_root", "Release", "bindings"],
        // Legacy from node-waf, node <= 0.4.x
        ["module_root", "build", "default", "bindings"],
        // Production "Release" buildtype binary (meh...)
        ["module_root", "compiled", "version", "platform", "arch", "bindings"],
        // node-qbs builds
        ["module_root", "addon-build", "release", "install-root", "bindings"],
        ["module_root", "addon-build", "debug", "install-root", "bindings"],
        ["module_root", "addon-build", "default", "install-root", "bindings"],
        // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
        ["module_root", "lib", "binding", "nodePreGyp", "bindings"]
      ]
    };
    function bindings(opts) {
      if (typeof opts == "string") {
        opts = { bindings: opts };
      } else if (!opts) {
        opts = {};
      }
      Object.keys(defaults).map(function(i2) {
        if (!(i2 in opts)) opts[i2] = defaults[i2];
      });
      if (!opts.module_root) {
        opts.module_root = exports2.getRoot(exports2.getFileName());
      }
      if (path3.extname(opts.bindings) != ".node") {
        opts.bindings += ".node";
      }
      var requireFunc = typeof __webpack_require__ === "function" ? __non_webpack_require__ : require;
      var tries = [], i = 0, l = opts.try.length, n, b, err;
      for (; i < l; i++) {
        n = join.apply(
          null,
          opts.try[i].map(function(p) {
            return opts[p] || p;
          })
        );
        tries.push(n);
        try {
          b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
          if (!opts.path) {
            b.path = n;
          }
          return b;
        } catch (e) {
          if (e.code !== "MODULE_NOT_FOUND" && e.code !== "QUALIFIED_PATH_RESOLUTION_FAILED" && !/not find/i.test(e.message)) {
            throw e;
          }
        }
      }
      err = new Error(
        "Could not locate the bindings file. Tried:\n" + tries.map(function(a) {
          return opts.arrow + a;
        }).join("\n")
      );
      err.tries = tries;
      throw err;
    }
    module2.exports = exports2 = bindings;
    exports2.getFileName = function getFileName(calling_file) {
      var origPST = Error.prepareStackTrace, origSTL = Error.stackTraceLimit, dummy = {}, fileName;
      Error.stackTraceLimit = 10;
      Error.prepareStackTrace = function(e, st) {
        for (var i = 0, l = st.length; i < l; i++) {
          fileName = st[i].getFileName();
          if (fileName !== __filename) {
            if (calling_file) {
              if (fileName !== calling_file) {
                return;
              }
            } else {
              return;
            }
          }
        }
      };
      Error.captureStackTrace(dummy);
      dummy.stack;
      Error.prepareStackTrace = origPST;
      Error.stackTraceLimit = origSTL;
      var fileSchema = "file://";
      if (fileName.indexOf(fileSchema) === 0) {
        fileName = fileURLToPath(fileName);
      }
      return fileName;
    };
    exports2.getRoot = function getRoot(file) {
      var dir = dirname(file), prev;
      while (true) {
        if (dir === ".") {
          dir = process.cwd();
        }
        if (exists(join(dir, "package.json")) || exists(join(dir, "node_modules"))) {
          return dir;
        }
        if (prev === dir) {
          throw new Error(
            'Could not find module root given file: "' + file + '". Do you have a `package.json` file? '
          );
        }
        prev = dir;
        dir = join(dir, "..");
      }
    };
  }
});

// node_modules/sqlite3/lib/sqlite3-binding.js
var require_sqlite3_binding = __commonJS({
  "node_modules/sqlite3/lib/sqlite3-binding.js"(exports2, module2) {
    module2.exports = require_bindings()("node_sqlite3.node");
  }
});

// node_modules/sqlite3/lib/trace.js
var require_trace = __commonJS({
  "node_modules/sqlite3/lib/trace.js"(exports2) {
    var util = require("util");
    function extendTrace(object, property, pos) {
      const old = object[property];
      object[property] = function() {
        const error = new Error();
        const name = object.constructor.name + "#" + property + "(" + Array.prototype.slice.call(arguments).map(function(el) {
          return util.inspect(el, false, 0);
        }).join(", ") + ")";
        if (typeof pos === "undefined") pos = -1;
        if (pos < 0) pos += arguments.length;
        const cb = arguments[pos];
        if (typeof arguments[pos] === "function") {
          arguments[pos] = function replacement() {
            const err = arguments[0];
            if (err && err.stack && !err.__augmented) {
              err.stack = filter(err).join("\n");
              err.stack += "\n--> in " + name;
              err.stack += "\n" + filter(error).slice(1).join("\n");
              err.__augmented = true;
            }
            return cb.apply(this, arguments);
          };
        }
        return old.apply(this, arguments);
      };
    }
    exports2.extendTrace = extendTrace;
    function filter(error) {
      return error.stack.split("\n").filter(function(line) {
        return line.indexOf(__filename) < 0;
      });
    }
  }
});

// node_modules/sqlite3/lib/sqlite3.js
var require_sqlite3 = __commonJS({
  "node_modules/sqlite3/lib/sqlite3.js"(exports2, module2) {
    var path3 = require("path");
    var sqlite32 = require_sqlite3_binding();
    var EventEmitter = require("events").EventEmitter;
    module2.exports = exports2 = sqlite32;
    function normalizeMethod(fn) {
      return function(sql) {
        let errBack;
        const args = Array.prototype.slice.call(arguments, 1);
        if (typeof args[args.length - 1] === "function") {
          const callback = args[args.length - 1];
          errBack = function(err) {
            if (err) {
              callback(err);
            }
          };
        }
        const statement = new Statement(this, sql, errBack);
        return fn.call(this, statement, args);
      };
    }
    function inherits(target, source) {
      for (const k in source.prototype)
        target.prototype[k] = source.prototype[k];
    }
    sqlite32.cached = {
      Database: function(file, a, b) {
        if (file === "" || file === ":memory:") {
          return new Database(file, a, b);
        }
        let db;
        file = path3.resolve(file);
        if (!sqlite32.cached.objects[file]) {
          db = sqlite32.cached.objects[file] = new Database(file, a, b);
        } else {
          db = sqlite32.cached.objects[file];
          const callback = typeof a === "number" ? b : a;
          if (typeof callback === "function") {
            let cb2 = function() {
              callback.call(db, null);
            };
            var cb = cb2;
            if (db.open) process.nextTick(cb2);
            else db.once("open", cb2);
          }
        }
        return db;
      },
      objects: {}
    };
    var Database = sqlite32.Database;
    var Statement = sqlite32.Statement;
    var Backup = sqlite32.Backup;
    inherits(Database, EventEmitter);
    inherits(Statement, EventEmitter);
    inherits(Backup, EventEmitter);
    Database.prototype.prepare = normalizeMethod(function(statement, params) {
      return params.length ? statement.bind.apply(statement, params) : statement;
    });
    Database.prototype.run = normalizeMethod(function(statement, params) {
      statement.run.apply(statement, params).finalize();
      return this;
    });
    Database.prototype.get = normalizeMethod(function(statement, params) {
      statement.get.apply(statement, params).finalize();
      return this;
    });
    Database.prototype.all = normalizeMethod(function(statement, params) {
      statement.all.apply(statement, params).finalize();
      return this;
    });
    Database.prototype.each = normalizeMethod(function(statement, params) {
      statement.each.apply(statement, params).finalize();
      return this;
    });
    Database.prototype.map = normalizeMethod(function(statement, params) {
      statement.map.apply(statement, params).finalize();
      return this;
    });
    Database.prototype.backup = function() {
      let backup;
      if (arguments.length <= 2) {
        backup = new Backup(this, arguments[0], "main", "main", true, arguments[1]);
      } else {
        backup = new Backup(this, arguments[0], arguments[1], arguments[2], arguments[3], arguments[4]);
      }
      backup.retryErrors = [sqlite32.BUSY, sqlite32.LOCKED];
      return backup;
    };
    Statement.prototype.map = function() {
      const params = Array.prototype.slice.call(arguments);
      const callback = params.pop();
      params.push(function(err, rows) {
        if (err) return callback(err);
        const result = {};
        if (rows.length) {
          const keys = Object.keys(rows[0]);
          const key = keys[0];
          if (keys.length > 2) {
            for (let i = 0; i < rows.length; i++) {
              result[rows[i][key]] = rows[i];
            }
          } else {
            const value = keys[1];
            for (let i = 0; i < rows.length; i++) {
              result[rows[i][key]] = rows[i][value];
            }
          }
        }
        callback(err, result);
      });
      return this.all.apply(this, params);
    };
    var isVerbose = false;
    var supportedEvents = ["trace", "profile", "change"];
    Database.prototype.addListener = Database.prototype.on = function(type) {
      const val = EventEmitter.prototype.addListener.apply(this, arguments);
      if (supportedEvents.indexOf(type) >= 0) {
        this.configure(type, true);
      }
      return val;
    };
    Database.prototype.removeListener = function(type) {
      const val = EventEmitter.prototype.removeListener.apply(this, arguments);
      if (supportedEvents.indexOf(type) >= 0 && !this._events[type]) {
        this.configure(type, false);
      }
      return val;
    };
    Database.prototype.removeAllListeners = function(type) {
      const val = EventEmitter.prototype.removeAllListeners.apply(this, arguments);
      if (supportedEvents.indexOf(type) >= 0) {
        this.configure(type, false);
      }
      return val;
    };
    sqlite32.verbose = function() {
      if (!isVerbose) {
        const trace = require_trace();
        [
          "prepare",
          "get",
          "run",
          "all",
          "each",
          "map",
          "close",
          "exec"
        ].forEach(function(name) {
          trace.extendTrace(Database.prototype, name);
        });
        [
          "bind",
          "get",
          "run",
          "all",
          "each",
          "map",
          "reset",
          "finalize"
        ].forEach(function(name) {
          trace.extendTrace(Statement.prototype, name);
        });
        isVerbose = true;
      }
      return sqlite32;
    };
  }
});

// api/server-entry.ts
var server_entry_exports = {};
__export(server_entry_exports, {
  createApp: () => createApp,
  getAppDb: () => getAppDb
});
module.exports = __toCommonJS(server_entry_exports);

// server/app.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);

// server/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var sqlite3 = null;
var DB_SQLITE_FILE = import_path.default.join(process.cwd(), "Payroll.db");
var SEED_EMPLOYEES = [
  {
    id: "EMP001",
    name: "Rahul Sharma",
    company: "SVN-1",
    designation: "Senior Production Head",
    department: "Engineering",
    email: "rahul.sharma@sakarelectricals.com",
    phone: "9876543210",
    joining_date: "2023-01-15",
    status: "ACTIVE",
    bank_name: "HDFC Bank",
    bank_account: "50100412345678",
    ifsc: "HDFC0000124",
    pan: "BKPPS1234F",
    uan: "100451239845",
    base_salary: 8e4,
    hra: 32e3,
    special_allowance: 15e3,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: false,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: "M.Tech in Manufacturing Engineering",
    location: "Savli Unit I, Vadodara",
    vehicle_detail: "Honda City (GJ-06-HM-1234)",
    prev_company_name: "ABB India Ltd",
    prev_company_location: "Maneja, Vadodara",
    total_experience: "8.5 Years",
    shift_timing: "8:00 AM to 5:30 PM",
    birth_year: 1990,
    needs_password_change: true,
    aadhaar_number: "123456789012",
    dob: "1990-05-15",
    gender: "Male",
    marital_status: "Married",
    emergency_contact: "9876543211",
    blood_group: "O+",
    esic_number: "37000451230001001",
    cost_center: "Savli Unit I",
    reporting_manager: "Management",
    employee_category: "Staff"
  },
  {
    id: "EMP002",
    name: "Priya Patel",
    company: "SVN-II",
    designation: "HR Lead Specialist",
    department: "Human Resources",
    email: "priya.patel@sakarelectricals.com",
    phone: "9823456789",
    joining_date: "2023-06-01",
    status: "ACTIVE",
    bank_name: "ICICI Bank",
    bank_account: "000401568241",
    ifsc: "ICIC0000004",
    pan: "AYZPP8765A",
    uan: "100874512963",
    base_salary: 42e3,
    hra: 16800,
    special_allowance: 6200,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: false,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: "MBA in Human Resources",
    location: "Corporate Office, Alkapuri",
    vehicle_detail: "Hyundai i20 (GJ-06-KK-5678)",
    prev_company_name: "L&T Power",
    prev_company_location: "Vadodara Office",
    total_experience: "5 Years",
    shift_timing: "9:30 AM to 6:30 PM",
    birth_year: 1992,
    needs_password_change: true,
    aadhaar_number: "234567890123",
    dob: "1992-08-20",
    gender: "Female",
    marital_status: "Single",
    emergency_contact: "9823456780",
    blood_group: "B+",
    esic_number: "37000451230001002",
    cost_center: "Corporate Office",
    reporting_manager: "Rahul Sharma",
    employee_category: "Staff"
  },
  {
    id: "EMP003",
    name: "Amit Mishra",
    company: "Sakar-I",
    designation: "Electrical Operations Manager",
    department: "Operations",
    email: "amit.mishra@sakarelectricals.com",
    phone: "7012345678",
    joining_date: "2024-02-10",
    status: "ACTIVE",
    bank_name: "State Bank of India",
    bank_account: "31245678901",
    ifsc: "SBIN0001254",
    pan: "CKMPM4321D",
    uan: "100652314569",
    base_salary: 22e3,
    hra: 8800,
    special_allowance: 3e3,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: false,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: "B.E. in Electrical Engineering",
    location: "Halol Unit II",
    vehicle_detail: "Maruti Swift (GJ-17-BC-9012)",
    prev_company_name: "Polycab India",
    prev_company_location: "Halol Industrial Area",
    total_experience: "4 Years",
    shift_timing: "8:00 AM to 5:30 PM",
    birth_year: 1994,
    needs_password_change: true,
    aadhaar_number: "345678901234",
    dob: "1994-11-12",
    gender: "Male",
    marital_status: "Married",
    emergency_contact: "7012345679",
    blood_group: "A+",
    esic_number: "37000341250001001",
    cost_center: "Halol Unit II",
    reporting_manager: "Rahul Sharma",
    employee_category: "Staff"
  },
  {
    id: "EMP004",
    name: "Sneha Reddy",
    company: "Sakar-III",
    designation: "Technical Sales Support",
    department: "Support",
    email: "sneha.reddy@sakarelectricals.com",
    phone: "9154678234",
    joining_date: "2024-09-01",
    status: "ACTIVE",
    bank_name: "Axis Bank",
    bank_account: "912010045612345",
    ifsc: "UTIB0000214",
    pan: "DFGPR9081C",
    uan: "100982314578",
    base_salary: 13e3,
    hra: 5200,
    special_allowance: 1200,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: true,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: "B.Sc in Electronics",
    location: "Sakar Unit III, Halol",
    vehicle_detail: "Honda Activa 6G (GJ-17-XY-4321)",
    prev_company_name: "Apar Industries",
    prev_company_location: "Umbergaon, Gujarat",
    total_experience: "2.5 Years",
    shift_timing: "9:30 AM to 6:30 PM",
    birth_year: 1996,
    needs_password_change: true,
    aadhaar_number: "456789012345",
    dob: "1996-03-30",
    gender: "Female",
    marital_status: "Single",
    emergency_contact: "9154678230",
    blood_group: "AB+",
    esic_number: "37000341250001002",
    cost_center: "Sakar Unit III",
    reporting_manager: "Priya Patel",
    employee_category: "Staff"
  },
  {
    id: "EMP005",
    name: "Vikram Singh",
    company: "SVN-1",
    designation: "Logistics Supervisor",
    department: "Administration",
    email: "vikram.singh@sakarelectricals.com",
    phone: "8234567890",
    joining_date: "2024-11-15",
    status: "ACTIVE",
    bank_name: "Punjab National Bank",
    bank_account: "02310001245623",
    ifsc: "PUNB0023100",
    pan: "GHKPS5544B",
    uan: "100741258963",
    base_salary: 11e3,
    hra: 4400,
    special_allowance: 1e3,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: true,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: "Diploma in Supply Chain",
    location: "Savli Unit I, Vadodara",
    vehicle_detail: "Hero Splendor (GJ-06-ZZ-8899)",
    prev_company_name: "Gati KWE",
    prev_company_location: "Ranoli, Vadodara",
    total_experience: "3 Years",
    shift_timing: "8:00 AM to 8:00 PM",
    birth_year: 1993,
    needs_password_change: true,
    aadhaar_number: "567890123456",
    dob: "1993-02-14",
    gender: "Male",
    marital_status: "Married",
    emergency_contact: "8234567891",
    blood_group: "O-",
    esic_number: "37000451230001001",
    cost_center: "Savli Unit I",
    reporting_manager: "Amit Mishra",
    employee_category: "Staff"
  },
  {
    id: "EMP006",
    name: "Amitabh Shah",
    company: "Flare-1",
    designation: "Senior Assembly Supervisor",
    department: "Production",
    email: "amitabh.shah@flaretech.com",
    phone: "9988776655",
    joining_date: "2023-08-10",
    status: "ACTIVE",
    bank_name: "HDFC Bank",
    bank_account: "50100223344556",
    ifsc: "HDFC0000124",
    pan: "FLKPS1234G",
    uan: "100451239899",
    base_salary: 35e3,
    hra: 14e3,
    special_allowance: 5e3,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: false,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: "Diploma in Electrical Engineering",
    location: "Savli GIDC, Savli",
    vehicle_detail: "Bajaj Pulsar (GJ-06-AA-1122)",
    prev_company_name: "Polycab India",
    prev_company_location: "Halol, Gujarat",
    total_experience: "5 Years",
    shift_timing: "8:00 AM to 5:30 PM",
    birth_year: 1994,
    needs_password_change: true,
    aadhaar_number: "987654321012",
    dob: "1994-04-12",
    gender: "Male",
    marital_status: "Married",
    emergency_contact: "9988776600",
    blood_group: "A+",
    esic_number: "37000991110001001",
    cost_center: "Flare Savli Unit I",
    reporting_manager: "Management",
    employee_category: "Staff"
  },
  {
    id: "EMP007",
    name: "Kiran Rao",
    company: "Zenivo-1",
    designation: "Systems Administrator",
    department: "Administration",
    email: "kiran.rao@zenivosystems.com",
    phone: "8877665544",
    joining_date: "2024-02-15",
    status: "ACTIVE",
    bank_name: "HDFC Bank",
    bank_account: "50100556677889",
    ifsc: "HDFC0000124",
    pan: "ZNKPS5678H",
    uan: "100874512900",
    base_salary: 45050,
    hra: 18020,
    special_allowance: 6e3,
    da: 0,
    pf_opt_in: true,
    esic_opt_in: false,
    professional_tax_opt_in: false,
    leave_balance_pl: 18,
    leave_balance_cl: 6,
    leave_balance_sl: 6,
    qualification: "B.Tech in Computer Science",
    location: "GIDC Makarpura, Vadodara",
    vehicle_detail: "Hyundai i10 (GJ-06-CC-3344)",
    prev_company_name: "Matrix Comsec",
    prev_company_location: "Vadodara, Gujarat",
    total_experience: "3 Years",
    shift_timing: "9:30 AM to 6:30 PM",
    birth_year: 1997,
    needs_password_change: true,
    aadhaar_number: "876543210901",
    dob: "1997-09-20",
    gender: "Female",
    marital_status: "Single",
    emergency_contact: "8877665500",
    blood_group: "B+",
    esic_number: "37000882220001001",
    cost_center: "Zenivo Makarpura Unit I",
    reporting_manager: "Management",
    employee_category: "Staff"
  }
];
var SEED_ATTENDANCE = [
  { id: "ATT-EMP001-2026-05", employee_id: "EMP001", month: "2026-05", total_days: 31, working_days: 31, lop_days: 0, overtime_hours: 4 },
  { id: "ATT-EMP002-2026-05", employee_id: "EMP002", month: "2026-05", total_days: 31, working_days: 30, lop_days: 1, overtime_hours: 0 },
  { id: "ATT-EMP003-2026-05", employee_id: "EMP003", month: "2026-05", total_days: 31, working_days: 29, lop_days: 2, overtime_hours: 5 },
  { id: "ATT-EMP004-2026-05", employee_id: "EMP004", month: "2026-05", total_days: 31, working_days: 31, lop_days: 0, overtime_hours: 0 },
  { id: "ATT-EMP005-2026-05", employee_id: "EMP005", month: "2026-05", total_days: 31, working_days: 28, lop_days: 3, overtime_hours: 2 }
];
var SEED_LEAVES = [
  {
    id: "LV001",
    employee_id: "EMP002",
    employee_name: "Priya Patel",
    company: "SVN-II",
    leave_type: "PL",
    start_date: "2026-05-12",
    end_date: "2026-05-12",
    days: 1,
    reason: "Family event in hometown",
    status: "APPROVED"
  },
  {
    id: "LV002",
    employee_id: "EMP003",
    employee_name: "Amit Mishra",
    company: "Sakar-I",
    leave_type: "SL",
    start_date: "2026-05-18",
    end_date: "2026-05-19",
    days: 2,
    reason: "Suffering from seasonal fever",
    status: "APPROVED"
  }
];
var MockDatabase = class {
  run(sql, paramsOrCb, cb) {
    const callback = typeof paramsOrCb === "function" ? paramsOrCb : cb;
    if (callback) {
      setTimeout(() => callback(null), 0);
    }
    return this;
  }
  all(sql, paramsOrCb, cb) {
    const callback = typeof paramsOrCb === "function" ? paramsOrCb : cb;
    const rows = [];
    if (callback) {
      setTimeout(() => callback(null, rows), 0);
    }
    return this;
  }
  serialize(cb) {
    cb();
  }
  close(cb) {
    if (cb) setTimeout(() => cb(null), 0);
  }
};
var PayrollDatabase = class _PayrollDatabase {
  /**
   * @param supabaseAdmin  Optional Supabase client (service_role key).
   *                       When provided, init() loads from Supabase and
   *                       persistData() pushes to Supabase.
   */
  constructor(supabaseAdmin) {
    this.data = {
      employees: [],
      attendance: [],
      payroll_runs: [],
      payslips: [],
      leave_applications: [],
      ff_settlements: [],
      loans: [],
      departments: [],
      companies: [],
      salary_revisions: [],
      audit_logs: [],
      assets: [],
      travel_reimbursements: [],
      broadcasts: [],
      attendance_corrections: [],
      compoff_requests: [],
      overtime_requests: [],
      users: [],
      hods: [],
      compoff_ledger: [],
      policies: [],
      policy_acknowledgements: [],
      gate_passes: [],
      loan_policy: null,
      // Workforce module (Phase A — foundation, additive)
      contractors: [],
      contractor_bills: [],
      contractor_bill_lines: [],
      cheque_payments: [],
      minimum_wage_rates: [],
      month_status: [],
      attendance_upload_batches: []
    };
    this.inMemoryOnly = false;
    /** When true, persistData() will NOT push to Supabase (seed data protection). */
    this.loadedFromSeed = false;
    /** OPTIMISTIC CONCURRENCY: tracks the Supabase updated_at we loaded from.
     *  On persist, we UPDATE WHERE updated_at = this value. If 0 rows affected,
     *  another writer overwrote us — we reload and retry. */
    this._loadedVersion = "";
    this._conflictCount = 0;
    /** Track last persist success/failure for HR error surfacing */
    this.lastPersistError = null;
    this.lastPersistSuccess = true;
    /** Track pending Supabase persist so API handlers can await it. */
    this._pendingPersist = null;
    /** Track when we last loaded from Supabase to avoid stale reloads. */
    this.lastLoadedAt = "";
    /**
     * Vercel: Refresh in-memory data from Supabase so warm-started instances
     * see mutations made by other serverless invocations.
     * 
     * Only reloads if Supabase has NEWER data (updated_at > lastLoadedAt)
     * to prevent overwriting fresh in-memory mutations with stale data.
     */
    /** Track when we last WROTE to Supabase (not just read). */
    this.lastPersistedAt = "";
    this.supabaseAdmin = supabaseAdmin || null;
  }
  static {
    this.MAX_CONFLICT_RETRIES = 3;
  }
  async init() {
    if (this.supabaseAdmin) {
      try {
        const TIMEOUT_MS = 1e4;
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error(`Supabase query timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
        );
        const queryPromise = this.supabaseAdmin.from("vetan_erp_store").select("payload, updated_at").eq("id", "live").maybeSingle();
        const { data: row, error } = await Promise.race([queryPromise, timeoutPromise]);
        if (!error && row?.payload && typeof row.payload === "object") {
          const payload = row.payload;
          if (Array.isArray(payload.employees) && payload.employees.length > 0) {
            this.data = { ...this.data, ...payload };
            this._loadedVersion = row.updated_at || "";
            this.dbSqlite = new MockDatabase();
            this.inMemoryOnly = true;
            this.loadedFromSeed = false;
            this.enforceCompanyCorrections();
            this.cleanupOrphanedPayrollRuns();
            console.log(`Loaded ERP data from Supabase (${this.data.employees.length} employees, version: ${this._loadedVersion}).`);
            return;
          }
        }
        console.warn("Supabase store empty or unavailable, falling back to local storage.");
      } catch (e) {
        console.error("Supabase init failed, falling back to local storage:", e.message || e);
      }
      this.loadedFromSeed = true;
      console.warn("[SAFETY] loadedFromSeed = true \u2014 persistData() will NOT push to Supabase until real data is loaded.");
    }
    const backupPath = import_path.default.join(process.cwd(), "payroll_persisted_store.json");
    let loadedFromBackup = false;
    if (backupPath && !this.supabaseAdmin) {
      if (import_fs.default.existsSync(backupPath)) {
        try {
          const raw = import_fs.default.readFileSync(backupPath, "utf-8");
          this.data = JSON.parse(raw);
          loadedFromBackup = true;
          console.log("[LOCAL DEV] Loaded schema data from JSON backup file (no Supabase).");
        } catch (err) {
          console.error("Failed to parse persisted JSON store:", err);
        }
      }
    } else if (backupPath && this.supabaseAdmin && this.loadedFromSeed) {
      console.warn("[SAFETY] Supabase unavailable \u2014 NOT loading stale local JSON. Starting with seed data.");
    }
    let sqlite3Mod = null;
    try {
      const imported = await Promise.resolve().then(() => __toESM(require_sqlite3(), 1));
      sqlite3Mod = imported.default || imported;
      sqlite3 = sqlite3Mod;
    } catch (err) {
      console.error("sqlite3 package could not be loaded dynamically (likely native binary incompatibility):", err);
    }
    return new Promise((originalResolve, reject) => {
      const resolve = () => {
        this.enforceCompanyCorrections();
        originalResolve();
      };
      const wrapDatabase = (dbInstance) => {
        if (!dbInstance) return;
        const originalRun = dbInstance.run;
        dbInstance.run = (...args) => {
          let callback = null;
          let newArgs = [...args];
          if (args.length > 0 && typeof args[args.length - 1] === "function") {
            callback = args[args.length - 1];
            newArgs[newArgs.length - 1] = (...callbackArgs) => {
              this.persistData();
              callback(...callbackArgs);
            };
          } else {
            newArgs.push(() => {
              this.persistData();
            });
          }
          const res = originalRun.apply(dbInstance, newArgs);
          this.persistData();
          return res;
        };
      };
      const initPureJSInMemory = () => {
        console.warn("FALLBACK: Initializing pure JavaScript in-memory database mode.");
        this.inMemoryOnly = true;
        this.dbSqlite = new MockDatabase();
        wrapDatabase(this.dbSqlite);
        try {
          if (!loadedFromBackup) {
            this.seedDataInMemoryDirectly();
            this.persistData();
          }
          console.log("Pure JavaScript in-memory database initialized and seeded successfully.");
          resolve();
        } catch (seedErr) {
          console.error("Failed to seed pure JS in-memory database:", seedErr);
          reject(seedErr);
        }
      };
      const tryConnectSQLite = (dbPathOrMemory) => {
        console.log(`Attempting to open SQLite database at: ${dbPathOrMemory}`);
        this.dbSqlite = new sqlite3Mod.Database(dbPathOrMemory, (err) => {
          if (err) {
            console.error(`Failed to open SQLite database at ${dbPathOrMemory}:`, err);
            if (dbPathOrMemory !== ":memory:") {
              console.warn("Falling back to in-memory SQLite database (:memory:)...");
              tryConnectSQLite(":memory:");
            } else {
              initPureJSInMemory();
            }
            return;
          }
          this.dbSqlite.serialize(() => {
            try {
              this.createTables();
              wrapDatabase(this.dbSqlite);
              if (loadedFromBackup) {
                this.restoreFullBackupJSON(this.data).then(() => {
                  console.log("Successfully restored loaded backup data into SQLite tables.");
                  resolve();
                }).catch((restoreErr) => {
                  console.error("Error restoring backup data into SQLite tables:", restoreErr);
                  resolve();
                });
              } else {
                this.loadAndSeed().then(() => {
                  console.log(`SQLite database successfully initialized and loaded/seeded from: ${dbPathOrMemory}`);
                  if (dbPathOrMemory === ":memory:") {
                    this.inMemoryOnly = true;
                  }
                  this.persistData();
                  resolve();
                }).catch((seedErr) => {
                  console.error(`Error seeding SQLite database at ${dbPathOrMemory}:`, seedErr);
                  if (dbPathOrMemory !== ":memory:") {
                    console.warn("Falling back to in-memory SQLite database (:memory:) due to seeding error...");
                    tryConnectSQLite(":memory:");
                  } else {
                    initPureJSInMemory();
                  }
                });
              }
            } catch (setupErr) {
              console.error(`Exception setting up database tables at ${dbPathOrMemory}:`, setupErr);
              if (dbPathOrMemory !== ":memory:") {
                console.warn("Falling back to in-memory SQLite database (:memory:) due to setup exception...");
                tryConnectSQLite(":memory:");
              } else {
                initPureJSInMemory();
              }
            }
          });
        });
      };
      if (sqlite3Mod && sqlite3Mod.Database) {
        try {
          tryConnectSQLite(DB_SQLITE_FILE);
        } catch (sqliteInitErr) {
          console.error("Exception thrown during sqlite3 connection attempt:", sqliteInitErr);
          tryConnectSQLite(":memory:");
        }
      } else {
        console.warn("sqlite3 is not available. Falling back immediately to Pure JS In-Memory Mode.");
        initPureJSInMemory();
      }
    });
  }
  cleanupOrphanedPayrollRuns() {
    if (!this.data.payroll_runs || this.data.payroll_runs.length === 0) return;
    const idMap = /* @__PURE__ */ new Map();
    for (const run of this.data.payroll_runs) {
      const existing = idMap.get(run.id);
      if (!existing) {
        idMap.set(run.id, [run]);
      } else {
        existing.push(run);
      }
    }
    const cleaned = [];
    for (const [runId, runs] of idMap) {
      if (runs.length === 1) {
        cleaned.push(runs[0]);
      } else {
        runs.sort((a, b) => (b.processed_at || "").localeCompare(a.processed_at || ""));
        console.log(`[Cleanup] Run ${runId}: ${runs.length} duplicates found, keeping most recent (${runs[0].status})`);
        cleaned.push(runs[0]);
      }
    }
    if (cleaned.length !== this.data.payroll_runs.length) {
      console.log(`[Cleanup] Payroll runs: ${this.data.payroll_runs.length} \u2192 ${cleaned.length}`);
      this.data.payroll_runs = cleaned;
      try {
        for (const [runId, runs] of idMap) {
          if (runs.length > 1) {
            const best = runs[0];
            this.dbSqlite.run(`DELETE FROM payroll_runs WHERE id = ? AND id != ?`, [runId, best.id]);
          }
        }
      } catch (e) {
      }
    }
  }
  enforceCompanyCorrections() {
    console.log("Enforcing correct company names and addresses...");
    const corrections = [
      {
        id: "SVN-1",
        name: "SVN Opto Electronics Pvt Ltd",
        registered_office: "Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210",
        factory_address: "Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210"
      },
      {
        id: "SVN-II",
        name: "SVN Opto Electronics Pvt Ltd",
        registered_office: "Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210",
        factory_address: "Survey No 370 (2)/1, Premises no. - 2, Building no. 1 & 2, Kachigam, Daman 396210"
      },
      {
        id: "Sakar-I",
        name: "Sakar Electricals & Electronics Pvt Ltd",
        registered_office: "Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210",
        factory_address: "Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210"
      },
      {
        id: "Sakar-III",
        name: "Sakar Electricals & Electronics Pvt Ltd",
        registered_office: "Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210",
        factory_address: "Plot No 60, Daman Ganga Industrial Park, Dungra, Vapi (Gujarat)"
      },
      {
        id: "Flare-1",
        name: "Flare Luminaires Pvt. Ltd.",
        registered_office: "Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210",
        factory_address: "Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210"
      },
      {
        id: "Zenivo-1",
        name: "Zenivo Opto Electronics Pvt Ltd",
        registered_office: "Survey No 98/8, Daman Industrial Estate, Kadlya, Daman",
        factory_address: "Survey No 98/8, Daman Industrial Estate, Kadlya, Daman"
      }
    ];
    if (!this.data.companies) {
      this.data.companies = [];
    }
    for (const corr of corrections) {
      const found = this.data.companies.find((c) => c.id === corr.id);
      if (found) {
        found.name = corr.name;
        found.registered_office = corr.registered_office;
        found.factory_address = corr.factory_address;
      } else {
        this.data.companies.push({
          id: corr.id,
          name: corr.name,
          unit_name: corr.id === "SVN-1" ? "Unit I" : corr.id === "SVN-II" ? "Unit II" : corr.id === "Sakar-I" ? "Unit I" : corr.id === "Sakar-III" ? "Unit III" : "Unit I",
          logo: "",
          registered_office: corr.registered_office,
          factory_address: corr.factory_address,
          gst_number: "",
          pan_number: "",
          tan_number: "",
          cin_number: "",
          pf_number: "",
          esic_number: "",
          pt_number: ""
        });
      }
      if (this.dbSqlite && typeof this.dbSqlite.run === "function" && !this.inMemoryOnly) {
        this.dbSqlite.run(
          `UPDATE companies SET name = ?, registered_office = ?, factory_address = ? WHERE id = ?`,
          [corr.name, corr.registered_office, corr.factory_address, corr.id],
          (err) => {
            if (err) console.error(`Error applying SQLite company correction for ${corr.id}:`, err);
          }
        );
      }
    }
    this.persistData();
  }
  seedDataInMemoryDirectly() {
    this.data.employees = [...SEED_EMPLOYEES];
    this.data.attendance = [...SEED_ATTENDANCE];
    this.data.leave_applications = [...SEED_LEAVES];
    this.data.departments = ["Production", "QC", "Maintenance", "Stores", "Purchase", "Accounts", "HR", "Dispatch", "Sales", "Marketing", "R&D", "Administration"];
    this.data.companies = [
      {
        id: "SVN-1",
        name: "SVN Opto Electronics Pvt Ltd",
        unit_name: "Unit I",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(50%2C%2050)%22%20stroke%3D%22none%22%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%22-25%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-35%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%22-25%22%20r%3D%224.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%220%22%20r%3D%225%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%225%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2235%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%2225%22%20r%3D%223.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-35%22%20cy%3D%220%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%22-15%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-20%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%22-15%22%20r%3D%223.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%220%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%2215%22%20r%3D%222.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-5%22%20cy%3D%22-5%22%20r%3D%222%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%222%22%20fill%3D%22%231B4F72%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22115%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23F07D1E%22%20letter-spacing%3D%221%22%3ESVN%3C%2Ftext%3E%3Ctext%20x%3D%22195%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22400%22%20font-size%3D%2232%22%20fill%3D%22%231B4F72%22%20letter-spacing%3D%221%22%3EOpto%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210",
        factory_address: "Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210",
        gst_number: "24AAACS9012J1Z3",
        pan_number: "AAACS9012J",
        tan_number: "BRDA01234D",
        cin_number: "U31900GJ2015PTC085123",
        pf_number: "GJ/BAR/0045621/000",
        esic_number: "37000451230001001",
        pt_number: "PEC240102034"
      },
      {
        id: "SVN-II",
        name: "SVN Opto Electronics Pvt Ltd",
        unit_name: "Unit II",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(50%2C%2050)%22%20stroke%3D%22none%22%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%22-25%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-35%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%22-25%22%20r%3D%224.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%220%22%20r%3D%225%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%225%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2235%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%2225%22%20r%3D%223.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-35%22%20cy%3D%220%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%22-15%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-20%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%22-15%22%20r%3D%223.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%220%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%2215%22%20r%3D%222.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-5%22%20cy%3D%22-5%22%20r%3D%222%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%222%22%20fill%3D%22%231B4F72%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22115%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23F07D1E%22%20letter-spacing%3D%221%22%3ESVN%3C%2Ftext%3E%3Ctext%20x%3D%22195%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22400%22%20font-size%3D%2232%22%20fill%3D%22%231B4F72%22%20letter-spacing%3D%221%22%3EOpto%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210",
        factory_address: "Survey No 370 (2)/1, Premises no. - 2, Building no. 1 & 2, Kachigam, Daman 396210",
        gst_number: "24AAACS9012J2Z4",
        pan_number: "AAACS9012J",
        tan_number: "BRDA01234E",
        cin_number: "U31900GJ2015PTC085123",
        pf_number: "GJ/BAR/0045621/001",
        esic_number: "37000451230001002",
        pt_number: "PEC240102035"
      },
      {
        id: "Sakar-I",
        name: "Sakar Electricals & Electronics Pvt Ltd",
        unit_name: "Unit I",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(10%2C%2010)%22%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2240%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%204%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2230%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%226%203%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2215%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%202%22%3E%3C%2Fellipse%3E%3Cline%20x1%3D%2220%22%20y1%3D%2250%22%20x2%3D%22100%22%20y2%3D%2250%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%3E%3C%2Fline%3E%3C%2Fg%3E%3Ctext%20x%3D%22120%22%20y%3D%2252%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2219%22%20fill%3D%22%232E2E2E%22%20letter-spacing%3D%221.5%22%3ESAKAR%20ELECTRICALS%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%2274%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2212%22%20fill%3D%22%235E5E5E%22%20letter-spacing%3D%220.8%22%3E%26%20ELECTRONICS%20PVT.%20LTD.%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210",
        factory_address: "Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210",
        gst_number: "24AABCS4512A1Z1",
        pan_number: "AABCS4512A",
        tan_number: "BRDA04512A",
        cin_number: "U31900GJ2012PTC074321",
        pf_number: "GJ/BAR/0034125/000",
        esic_number: "37000341250001001",
        pt_number: "PEC240104512"
      },
      {
        id: "Sakar-III",
        name: "Sakar Electricals & Electronics Pvt Ltd",
        unit_name: "Unit III",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(10%2C%2010)%22%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2240%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%204%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2230%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%226%203%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2215%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%202%22%3E%3C%2Fellipse%3E%3Cline%20x1%3D%2220%22%20y1%3D%2250%22%20x2%3D%22100%22%20y2%3D%2250%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%3E%3C%2Fline%3E%3C%2Fg%3E%3Ctext%20x%3D%22120%22%20y%3D%2252%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2219%22%20fill%3D%22%232E2E2E%22%20letter-spacing%3D%221.5%22%3ESAKAR%20ELECTRICALS%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%2274%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2212%22%20fill%3D%22%235E5E5E%22%20letter-spacing%3D%220.8%22%3E%26%20ELECTRONICS%20PVT.%20LTD.%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210",
        factory_address: "Plot No 60, Daman Ganga Industrial Park, Dungra, Vapi (Gujarat)",
        gst_number: "24AABCS4512A3Z3",
        pan_number: "AABCS4512A",
        tan_number: "BRDA04512B",
        cin_number: "U31900GJ2012PTC074321",
        pf_number: "GJ/BAR/0034125/002",
        esic_number: "37000341250001002",
        pt_number: "PEC240104513"
      },
      {
        id: "Flare-1",
        name: "Flare Luminaires Pvt Ltd",
        unit_name: "Unit I",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2270%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2236%22%20fill%3D%22%23E11D48%22%3EFLARE%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210",
        factory_address: "Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210",
        gst_number: "24AAFCS1122K1Z9",
        pan_number: "AAFCS1122K",
        tan_number: "BRDA09988D",
        cin_number: "U72200GJ2018PTC102948",
        pf_number: "GJ/BAR/0099111/000",
        esic_number: "37000991110001001",
        pt_number: "PEC240109911"
      },
      {
        id: "Zenivo-1",
        name: "Zenivo Opto Electronics Pvt Ltd",
        unit_name: "Unit I",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2270%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2236%22%20fill%3D%22%232563EB%22%3EZENIVO%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No 98/8, Daman Industrial Estate, Kadlya, Daman",
        factory_address: "Survey No 98/8, Daman Industrial Estate, Kadlya, Daman",
        gst_number: "24AAZCS3344L1Z2",
        pan_number: "AAZCS3344L",
        tan_number: "BRDA07766E",
        cin_number: "U72300GJ2019PTC108247",
        pf_number: "GJ/BAR/0088222/000",
        esic_number: "37000882220001001",
        pt_number: "PEC240108822"
      }
    ];
    const month = "2026-05";
    const computedSlips = [];
    let gross_total = 0;
    let deduct_total = 0;
    let net_total = 0;
    for (const emp of this.data.employees) {
      const att = this.data.attendance.find((a) => a.employee_id === emp.id) || {
        total_days: 31,
        working_days: 31,
        lop_days: 0,
        overtime_hours: 0,
        id: `ATT-${emp.id}-${month}`,
        employee_id: emp.id,
        month
      };
      const slip = this.calculateSingleSlip(emp, att, month);
      computedSlips.push(slip);
      gross_total += slip.gross_salary;
      deduct_total += slip.total_deductions;
      net_total += slip.net_salary;
    }
    this.data.payroll_runs = [
      {
        id: `RUN-${month}`,
        month,
        status: "CLOSED",
        processed_at: (/* @__PURE__ */ new Date()).toISOString(),
        total_employees: computedSlips.length,
        total_gross: gross_total,
        total_deductions: deduct_total,
        total_net: net_total
      }
    ];
    this.data.payslips = computedSlips;
    this.data.audit_logs = [];
    this.data.ff_settlements = [];
    this.data.loans = [];
    this.data.salary_revisions = [];
    this.data.assets = [];
    this.data.travel_reimbursements = [];
    this.data.broadcasts = [];
    this.data.users = [
      { id: "USR001", username: "vishnu", name: "Vishnu Arrawatia", role: "SUPER_HR", title: "Super Admin", company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"], password: "Varrawatia", disabled: false },
      { id: "USR011", username: "varrawatia", name: "Varrawatia (Admin)", role: "SUPER_HR", title: "Super Admin", company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"], password: "Varrawatia", disabled: false },
      { id: "USR002", username: "vijay", name: "Mr. V. K. Saraf (MD)", role: "MANAGEMENT", title: "Managing Director", company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"], password: "VKS", disabled: false },
      { id: "USR012", username: "vks", name: "VKS (MD)", role: "MANAGEMENT", title: "Managing Director", company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"], password: "VKS", disabled: false },
      { id: "USR003", username: "vijendra", name: "Vijendra", role: "COMPANY_HR", title: "HR Officer (SVN Unit I)", company_rights: ["SVN-1"], password: "vijendra", disabled: false },
      { id: "USR004", username: "manisha_s", name: "Manisha Sapate", role: "COMPANY_HR", title: "HR Officer (SVN Unit II)", company_rights: ["SVN-II"], password: "manisha_s", disabled: false },
      { id: "USR005", username: "manisha", name: "Manisha", role: "COMPANY_HR", title: "HR Officer (Sakar Unit I)", company_rights: ["Sakar-I"], password: "manisha", disabled: false },
      { id: "USR006", username: "indraprakash", name: "Indraprakash", role: "COMPANY_HR", title: "HR Officer (Sakar Unit III)", company_rights: ["Sakar-III"], password: "indraprakash", disabled: false },
      { id: "USR007", username: "nilesh", name: "Nilesh", role: "COMPANY_HR", title: "HR Officer (Flare)", company_rights: ["Flare-1"], password: "nilesh", disabled: false },
      { id: "USR008", username: "pinki", name: "Pinki", role: "COMPANY_HR", title: "HR Officer (Zenivo)", company_rights: ["Zenivo-1"], password: "pinki", disabled: false },
      { id: "USR009", username: "audit", name: "Auditor", role: "AUDITOR", title: "Statutory Auditor", company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"], password: "audit", disabled: false },
      { id: "USR020", username: "acct_vks", name: "Accounts - VKS", role: "AUDITOR", title: "Accounts Officer (All Units)", company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"], password: "VKS123", disabled: false },
      { id: "USR021", username: "acct_svn1", name: "Accounts - SVN I", role: "AUDITOR", title: "Accounts Officer (SVN-I)", company_rights: ["SVN-1"], password: "SVN1ACC", disabled: false },
      { id: "USR022", username: "acct_svn2", name: "Accounts - SVN II", role: "AUDITOR", title: "Accounts Officer (SVN-II)", company_rights: ["SVN-II"], password: "SVN2ACC", disabled: false },
      { id: "USR023", username: "acct_sakar", name: "Accounts - Sakar", role: "AUDITOR", title: "Accounts Officer (Sakar)", company_rights: ["Sakar-I", "Sakar-III"], password: "SAKACC", disabled: false }
    ];
  }
  createTables() {
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT,
      unit_name TEXT,
      logo TEXT,
      registered_office TEXT,
      factory_address TEXT,
      gst_number TEXT,
      pan_number TEXT,
      tan_number TEXT,
      cin_number TEXT,
      pf_number TEXT,
      esic_number TEXT,
      pt_number TEXT,
      settings TEXT
    )`, () => {
      this.dbSqlite.run(`ALTER TABLE companies ADD COLUMN settings TEXT`, () => {
      });
    });
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS departments (
      name TEXT PRIMARY KEY
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      name TEXT,
      company TEXT,
      designation TEXT,
      department TEXT,
      email TEXT,
      phone TEXT,
      joining_date TEXT,
      exit_date TEXT,
      status TEXT,
      bank_name TEXT,
      bank_account TEXT,
      ifsc TEXT,
      pan TEXT,
      uan TEXT,
      base_salary REAL,
      hra REAL,
      special_allowance REAL,
      da REAL,
      pf_opt_in INTEGER,
      esic_opt_in INTEGER,
      professional_tax_opt_in INTEGER,
      leave_balance_pl REAL,
      leave_balance_cl REAL,
      leave_balance_sl REAL,
      qualification TEXT,
      location TEXT,
      vehicle_detail TEXT,
      prev_company_name TEXT,
      prev_company_location TEXT,
      total_experience TEXT,
      shift_timing TEXT,
      password TEXT,
      birth_year INTEGER,
      needs_password_change INTEGER,
      aadhaar_number TEXT,
      dob TEXT,
      gender TEXT,
      marital_status TEXT,
      emergency_contact TEXT,
      blood_group TEXT,
      esic_number TEXT,
      cost_center TEXT,
      reporting_manager TEXT,
      employee_category TEXT,
       reporting_hod TEXT,
      reporting_hod_name TEXT,
      conveyance_allowance REAL,
      edu_allowance REAL,
      medical_allowance REAL,
      hidden_salary_heads TEXT,
      salary_structure_type TEXT,
      bonus_payable REAL,
      ctc_salary REAL,
      reporting_hod_code TEXT,
      is_hod INTEGER,
      can_approve_leave INTEGER,
      can_approve_misspunch INTEGER,
      photo TEXT
    )`, () => {
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN reporting_hod TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN reporting_hod_name TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN conveyance_allowance REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN edu_allowance REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN medical_allowance REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN hidden_salary_heads TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN salary_structure_type TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN bonus_payable REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN ctc_salary REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN reporting_hod_code TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN is_hod INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN can_approve_leave INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN can_approve_misspunch INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN photo TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN pf_member_id TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN form_11_status TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN form_11_file TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN pf_non_deduction_reason TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN pf_verified_by TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN pf_verification_date TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN pf_hr_remarks TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN qualification TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN location TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN vehicle_detail TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN prev_company_name TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN prev_company_location TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN total_experience TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN shift_timing TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN password TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN birth_year INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN needs_password_change INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN aadhaar_number TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN dob TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN gender TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN marital_status TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN emergency_contact TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN blood_group TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN esic_number TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN cost_center TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN reporting_manager TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE employees ADD COLUMN employee_category TEXT`, () => {
      });
      this.dbSqlite.run(`UPDATE employees SET salary_structure_type = 'FIXED' WHERE salary_structure_type IS NULL OR salary_structure_type = 'PERCENTAGE'`, () => {
      });
    });
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      month TEXT,
      total_days INTEGER,
      working_days INTEGER,
      lop_days INTEGER,
      overtime_hours REAL,
      present INTEGER,
      absent INTEGER,
      weekly_off INTEGER,
      paid_holiday INTEGER,
      leave INTEGER,
      lwp INTEGER,
      ot_hours REAL,
      is_locked INTEGER DEFAULT 0
    )`, () => {
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN present INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN absent INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN weekly_off INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN paid_holiday INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN leave INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN lwp INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN ot_hours REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN is_locked INTEGER DEFAULT 0`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN in_time TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN out_time TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN leave_pl REAL DEFAULT 0`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN leave_cl REAL DEFAULT 0`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN leave_sl REAL DEFAULT 0`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN compoff_used REAL DEFAULT 0`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN out_time TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE attendance ADD COLUMN pay_days REAL`, () => {
      });
      try {
        this.dbSqlite.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_emp_month ON attendance (employee_id, month)`);
      } catch (e) {
      }
    });
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS payroll_runs (
      id TEXT PRIMARY KEY,
      month TEXT,
      status TEXT,
      processed_at TEXT,
      total_employees INTEGER,
      total_gross REAL,
      total_deductions REAL,
      total_net REAL
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS payslips (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      designation TEXT,
      department TEXT,
      pan TEXT,
      uan TEXT,
      bank_name TEXT,
      bank_account TEXT,
      ifsc TEXT,
      month TEXT,
      rate_base_salary REAL,
      rate_hra REAL,
      rate_special_allowance REAL,
      rate_da REAL,
      rate_edu_allowance REAL,
      rate_medical_allowance REAL,
      rate_conveyance_allowance REAL,
      earned_base_salary REAL,
      earned_hra REAL,
      earned_special_allowance REAL,
      earned_da REAL,
      earned_edu_allowance REAL,
      earned_medical_allowance REAL,
      earned_conveyance_allowance REAL,
      overtime_pay REAL,
      lop_deduction REAL,
      pf_deduction REAL,
      esic_deduction REAL,
      professional_tax REAL,
      tds REAL,
      custom_deductions REAL,
      loan_deduction REAL,
      salary_advance REAL,
      gross_salary REAL,
      total_deductions REAL,
      net_salary REAL,
      employer_pf REAL,
      employer_esic REAL,
      payment_status TEXT DEFAULT 'PENDING',
      payment_date TEXT,
      hidden_salary_heads TEXT,
      salary_structure_type TEXT
    )`, () => {
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN hidden_salary_heads TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN salary_structure_type TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN salary_advance REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN bonus_incentive REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN performance_incentive REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN attendance_incentive REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN production_incentive REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN reimbursement REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN special_allowance_addition REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN arrear_payment REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN other_earnings REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN canteen_deduction REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN uniform_deduction REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN notice_deduction REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN mobile_deduction REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN damage_deduction REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN remarks TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN pay_days REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN calendar_days REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN bonus_incentive REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN rate_bonus_payable REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN earned_bonus_payable REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN ctc_salary REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN employer_pf REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE payslips ADD COLUMN employer_esic REAL`, () => {
      });
      try {
        this.dbSqlite.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_payslips_emp_month ON payslips (employee_id, month)`);
      } catch (e) {
      }
    });
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS leave_applications (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      leave_type TEXT,
      start_date TEXT,
      end_date TEXT,
      days INTEGER,
      reason TEXT,
      status TEXT,
      applied_date TEXT,
      reporting_hod TEXT,
      reporting_hod_name TEXT,
      hod_approved_date TEXT,
      hr_approved_date TEXT,
      hod_id TEXT,
      hr_id TEXT,
      escalated_reminder_sent INTEGER DEFAULT 0
    )`, () => {
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN applied_date TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN reporting_hod TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN reporting_hod_name TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN hod_approved_date TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN hr_approved_date TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN hod_id TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN hr_id TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE leave_applications ADD COLUMN escalated_reminder_sent INTEGER DEFAULT 0`, () => {
      });
    });
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS attendance_corrections (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      date TEXT,
      original_status TEXT,
      requested_status TEXT,
      reason TEXT,
      applied_date TEXT,
      reporting_hod TEXT,
      reporting_hod_name TEXT,
      status TEXT,
      hod_approved_date TEXT,
      hr_approved_date TEXT,
      hod_id TEXT,
      hr_id TEXT,
      escalated_reminder_sent INTEGER DEFAULT 0
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS compoff_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      date TEXT,
      reason TEXT,
      applied_date TEXT,
      reporting_hod TEXT,
      reporting_hod_name TEXT,
      status TEXT,
      hod_approved_date TEXT,
      hr_approved_date TEXT,
      hod_id TEXT,
      hr_id TEXT,
      escalated_reminder_sent INTEGER DEFAULT 0
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS overtime_requests (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      date TEXT,
      hours REAL,
      reason TEXT,
      applied_date TEXT,
      reporting_hod TEXT,
      reporting_hod_name TEXT,
      status TEXT,
      hod_approved_date TEXT,
      hr_approved_date TEXT,
      hod_id TEXT,
      hr_id TEXT,
      escalated_reminder_sent INTEGER DEFAULT 0
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS ff_settlements (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      last_working_day TEXT,
      gratuity_earned REAL,
      earned_leave_encashment REAL,
      unpaid_salary_days INTEGER,
      unpaid_salary_earned REAL,
      notice_period_deduction REAL,
      pending_bonus REAL,
      gross_earnings REAL,
      gross_deductions REAL,
      net_settlement_pay REAL,
      status TEXT
    )`);
    this.dbSqlite.serialize(() => {
      this.dbSqlite.run(`ALTER TABLE ff_settlements ADD COLUMN pending_bonus REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE ff_settlements ADD COLUMN meta_json TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN opening_balance REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN opening_date TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN skipped_months TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN additional_loans TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN loan_number TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN loan_type TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN interest_rate REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN total_installments INTEGER`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN emi_start_month TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN approval_authority TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN remarks TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN settlements TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN closed_date TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN closure_reference TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN audit_trail TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_id TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_code TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_name TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_department TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_monthly_salary REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor1_guarantee_limit REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_id TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_code TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_name TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_department TEXT`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_monthly_salary REAL`, () => {
      });
      this.dbSqlite.run(`ALTER TABLE loans ADD COLUMN guarantor2_guarantee_limit REAL`, () => {
      });
    });
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      amount REAL,
      month TEXT,
      monthly_deduction REAL,
      reason TEXT,
      status TEXT,
      opening_balance REAL DEFAULT 0
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS bonus_provisions (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      month TEXT,
      base_salary REAL,
      bonus_rate REAL DEFAULT 8.33,
      bonus_amount REAL,
      status TEXT DEFAULT 'ACCUMULATED',
      paid_in_month TEXT,
      created_at TEXT
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS salary_revisions (
      id TEXT PRIMARY KEY,
      employee_code TEXT,
      old_salary REAL,
      new_salary REAL,
      effective_date TEXT,
      reason TEXT,
      approved_by TEXT,
      created_at TEXT,
      remarks TEXT,
      increment_amount REAL,
      old_structure TEXT,
      new_structure TEXT
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT,
      details TEXT,
      user_name TEXT,
      timestamp TEXT
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      asset_name TEXT,
      serial_number TEXT,
      type TEXT,
      issue_date TEXT,
      return_date TEXT,
      status TEXT,
      condition TEXT
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS travel_reimbursements (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      month TEXT,
      fuel_liters REAL,
      rate_per_liter REAL,
      amount REAL,
      travel_purpose TEXT,
      status TEXT
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS broadcasts (
      id TEXT PRIMARY KEY,
      title TEXT,
      message TEXT,
      target_type TEXT,
      target_value TEXT,
      created_at TEXT,
      created_by TEXT
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      email_address TEXT,
      salary_month TEXT,
      sent_at TEXT,
      delivery_status TEXT,
      error_message TEXT
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS smtp_settings (
      id TEXT PRIMARY KEY,
      smtp_server TEXT,
      smtp_port INTEGER,
      sender_email TEXT,
      sender_password TEXT,
      provider TEXT
    )`);
    this.dbSqlite.run(`INSERT OR IGNORE INTO smtp_settings (id, smtp_server, smtp_port, sender_email, sender_password, provider) VALUES ('DEFAULT', 'smtp.gmail.com', 587, 'payroll@vetanerp.com', 'SecurePass123', 'Gmail')`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )`, () => {
      const hashedDefault = import_crypto.default.createHash("sha256").update("1234").digest("hex");
      this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('super_admin_pin', ?)`, [hashedDefault]);
      this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('pin_changed_from_default', '0')`);
      this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('production_security_enabled', '0')`);
    });
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      name TEXT,
      role TEXT,
      company_rights TEXT,
      title TEXT,
      password TEXT,
      disabled INTEGER DEFAULT 0
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS hods (
      id TEXT PRIMARY KEY,
      name TEXT,
      department TEXT,
      company TEXT,
      active INTEGER DEFAULT 1
    )`);
    const defaultUsers = [
      { id: "USR001", username: "vishnu", name: "Vishnu Arrawatia", role: "SUPER_HR", title: "Super Admin", company_rights: JSON.stringify(["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"]), password: "Varrawatia", disabled: 0 },
      { id: "USR011", username: "varrawatia", name: "Varrawatia (Admin)", role: "SUPER_HR", title: "Super Admin", company_rights: JSON.stringify(["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"]), password: "Varrawatia", disabled: 0 },
      { id: "USR002", username: "vijay", name: "Mr. V. K. Saraf (MD)", role: "MANAGEMENT", title: "Managing Director", company_rights: JSON.stringify(["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"]), password: "VKS", disabled: 0 },
      { id: "USR012", username: "vks", name: "VKS (MD)", role: "MANAGEMENT", title: "Managing Director", company_rights: JSON.stringify(["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"]), password: "VKS", disabled: 0 },
      { id: "USR003", username: "vijendra", name: "Vijendra", role: "COMPANY_HR", title: "HR Officer (SVN Unit I)", company_rights: JSON.stringify(["SVN-1"]), password: "vijendra", disabled: 0 },
      { id: "USR004", username: "manisha_s", name: "Manisha Sapate", role: "COMPANY_HR", title: "HR Officer (SVN Unit II)", company_rights: JSON.stringify(["SVN-II"]), password: "manisha_s", disabled: 0 },
      { id: "USR005", username: "manisha", name: "Manisha", role: "COMPANY_HR", title: "HR Officer (Sakar Unit I)", company_rights: JSON.stringify(["Sakar-I"]), password: "manisha", disabled: 0 },
      { id: "USR006", username: "indraprakash", name: "Indraprakash", role: "COMPANY_HR", title: "HR Officer (Sakar Unit III)", company_rights: JSON.stringify(["Sakar-III"]), password: "indraprakash", disabled: 0 },
      { id: "USR007", username: "nilesh", name: "Nilesh", role: "COMPANY_HR", title: "HR Officer (Flare)", company_rights: JSON.stringify(["Flare-1"]), password: "nilesh", disabled: 0 },
      { id: "USR008", username: "pinki", name: "Pinki", role: "COMPANY_HR", title: "HR Officer (Zenivo)", company_rights: JSON.stringify(["Zenivo-1"]), password: "pinki", disabled: 0 },
      { id: "USR009", username: "audit", name: "Auditor", role: "AUDITOR", title: "Statutory Auditor", company_rights: JSON.stringify(["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"]), password: "audit", disabled: 0 }
    ];
    for (const u of defaultUsers) {
      this.dbSqlite.run(
        `INSERT OR IGNORE INTO users (id, username, name, role, company_rights, title, password, disabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.username, u.name, u.role, u.company_rights, u.title, u.password, u.disabled]
      );
    }
    const defaultHods = [
      { id: "HOD001", name: "Alok Sharma", department: "Production", company: "SVN-1", active: 1 },
      { id: "HOD002", name: "Ritesh Saxena", department: "Quality", company: "SVN-II", active: 1 },
      { id: "HOD003", name: "Sanjay Rawat", department: "Maintenance", company: "Sakar-I", active: 1 },
      { id: "HOD004", name: "Vimal Kumar", department: "Logistics", company: "Sakar-III", active: 1 }
    ];
    for (const h of defaultHods) {
      this.dbSqlite.run(
        `INSERT OR IGNORE INTO hods (id, name, department, company, active) VALUES (?, ?, ?, ?, ?)`,
        [h.id, h.name, h.department, h.company, h.active]
      );
    }
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS compoff_ledger (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      date_earned TEXT,
      reason TEXT,
      earned_days REAL,
      availed_days REAL,
      balance REAL,
      expiry_date TEXT
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS policies (
      id TEXT PRIMARY KEY,
      name TEXT,
      content TEXT,
      pdf_url TEXT,
      version TEXT,
      is_archived INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS policy_acknowledgements (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      policy_name TEXT,
      read_date TEXT,
      acknowledgement_date TEXT,
      version TEXT
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS gate_passes (
      id TEXT PRIMARY KEY,
      employee_id TEXT,
      employee_name TEXT,
      company TEXT,
      target_company TEXT,
      purpose TEXT,
      applied_date TEXT,
      status TEXT,
      reporting_hod TEXT,
      reporting_hod_name TEXT,
      departure_time TEXT,
      arrival_time TEXT,
      return_departure_time TEXT,
      return_arrival_time TEXT,
      out_gate_security_id TEXT,
      in_gate_security_id TEXT,
      return_out_gate_security_id TEXT,
      return_in_gate_security_id TEXT,
      destination_type TEXT,
      vendor_location TEXT
    )`);
    this.dbSqlite.run(`ALTER TABLE gate_passes ADD COLUMN destination_type TEXT`, (err) => {
    });
    this.dbSqlite.run(`ALTER TABLE gate_passes ADD COLUMN vendor_location TEXT`, (err) => {
    });
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS shifts (
      code TEXT PRIMARY KEY,
      name TEXT,
      start_time TEXT,
      end_time TEXT,
      grace_time INTEGER,
      weekly_off TEXT
    )`, () => {
      const defaultShifts = [
        { code: "GEN", name: "General Shift", start_time: "09:00 AM", end_time: "06:30 PM", grace_time: 15, weekly_off: "Sunday" },
        { code: "PROD_A", name: "Production Shift A", start_time: "08:00 AM", end_time: "05:30 PM", grace_time: 15, weekly_off: "Sunday" },
        { code: "PROD_B", name: "Production Shift B", start_time: "12:00 PM", end_time: "09:00 PM", grace_time: 15, weekly_off: "Sunday" },
        { code: "SEC", name: "Security Shift", start_time: "08:00 AM", end_time: "08:00 PM", grace_time: 15, weekly_off: "Sunday" },
        { code: "NIGHT", name: "Night Shift", start_time: "09:00 PM", end_time: "06:00 AM", grace_time: 15, weekly_off: "Sunday" }
      ];
      for (const s of defaultShifts) {
        this.dbSqlite.run(
          `INSERT OR IGNORE INTO shifts (code, name, start_time, end_time, grace_time, weekly_off) VALUES (?, ?, ?, ?, ?, ?)`,
          [s.code, s.name, s.start_time, s.end_time, s.grace_time, s.weekly_off]
        );
      }
    });
    const addColumnSafe = (table, colDef) => {
      this.dbSqlite.run(`PRAGMA table_info(${table})`, (err, cols) => {
        if (err) return;
        const exists = Array.isArray(cols) && cols.some((c) => c.name === colDef.split(" ")[0]);
        if (!exists) {
          this.dbSqlite.run(`ALTER TABLE ${table} ADD COLUMN ${colDef}`, (e) => {
          });
        }
      });
    };
    addColumnSafe("companies", "pf_esic_applicable INTEGER DEFAULT 1");
    addColumnSafe("companies", "security_mode TEXT DEFAULT 'testing'");
    addColumnSafe("employees", "contractor_id TEXT DEFAULT NULL");
    addColumnSafe("employees", "is_company_worker INTEGER DEFAULT 0");
    addColumnSafe("employees", "payment_mode TEXT DEFAULT 'HDFC'");
    addColumnSafe("attendance", "upload_batch_id TEXT DEFAULT NULL");
    addColumnSafe("attendance", "upload_source TEXT DEFAULT 'EXCEL'");
    addColumnSafe("attendance", "file_name TEXT DEFAULT NULL");
    addColumnSafe("attendance", "locked_by TEXT DEFAULT NULL");
    addColumnSafe("attendance", "locked_at TEXT DEFAULT NULL");
    addColumnSafe("attendance", "lock_reason TEXT DEFAULT NULL");
    addColumnSafe("payslips", "ncp_days REAL DEFAULT 0");
    addColumnSafe("payslips", "applicable_days REAL DEFAULT 0");
    addColumnSafe("payslips", "worker_category TEXT DEFAULT NULL");
    addColumnSafe("payslips", "contractor_id TEXT DEFAULT NULL");
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS contractors (
      id TEXT PRIMARY KEY, name TEXT, company TEXT, unit TEXT,
      gst TEXT, pan TEXT, contact TEXT, active INTEGER DEFAULT 1
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS minimum_wage_rates (
      id TEXT PRIMARY KEY, company TEXT, unit TEXT, worker_category TEXT,
      wage_group TEXT, effective_from TEXT, effective_to TEXT,
      minimum_wage REAL, active INTEGER DEFAULT 1
    )`);
    this.dbSqlite.run(`CREATE INDEX IF NOT EXISTS idx_minwage_lookup ON minimum_wage_rates (company, unit, worker_category, wage_group, effective_from)`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS contractor_bills (
      id TEXT PRIMARY KEY, company TEXT, contractor_id TEXT, month TEXT,
      status TEXT DEFAULT 'DRAFT', total_gross REAL DEFAULT 0,
      total_pf REAL DEFAULT 0, total_esic REAL DEFAULT 0, net_payable REAL DEFAULT 0,
            created_by TEXT, created_at TEXT, locked INTEGER DEFAULT 0
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS contractor_bill_lines (
      id TEXT PRIMARY KEY, bill_id TEXT, employee_id TEXT, worker_name TEXT,
      present_days REAL DEFAULT 0, leave_days REAL DEFAULT 0, weekly_off REAL DEFAULT 0,
      holiday REAL DEFAULT 0, paid_days REAL DEFAULT 0, ncp_days REAL DEFAULT 0,
      wage_rate REAL DEFAULT 0, gross_wages REAL DEFAULT 0, pf REAL DEFAULT 0,
      esic REAL DEFAULT 0, other_deductions REAL DEFAULT 0, net_payable REAL DEFAULT 0
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS cheque_payments (
      id TEXT PRIMARY KEY, employee_id TEXT, company TEXT, month TEXT,
      net_pay REAL DEFAULT 0, cheque_number TEXT, payment_date TEXT, remarks TEXT
    )`);
    this.dbSqlite.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_cheque_uniq ON cheque_payments (company, month, employee_id)`);
    this.dbSqlite.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_cheque_num ON cheque_payments (company, month, cheque_number)`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS month_status (
      company TEXT, month TEXT, state TEXT DEFAULT 'OPEN',
      locked_by TEXT, locked_at TEXT, lock_reason TEXT, updated_at TEXT,
      PRIMARY KEY (company, month)
    )`);
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS attendance_upload_batches (
      id TEXT PRIMARY KEY, company TEXT, month TEXT, source TEXT DEFAULT 'CSV',
      file_name TEXT, uploaded_by TEXT, uploaded_at TEXT,
      staff_skipped INTEGER DEFAULT 0, worker_rows INTEGER DEFAULT 0,
      duplicate_ids TEXT, status TEXT DEFAULT 'OK'
    )`);
    this.dbSqlite.run(`ALTER TABLE attendance_upload_batches ADD COLUMN exceptions_json TEXT`, () => {
    });
    this.dbSqlite.run(`CREATE TABLE IF NOT EXISTS company_worker_payroll (
      id TEXT PRIMARY KEY, company TEXT, month TEXT, worker_id TEXT, name TEXT, category TEXT,
      unit TEXT, contractor TEXT, paid_days REAL DEFAULT 0, wage_rate REAL DEFAULT 0,
      gross_wages REAL DEFAULT 0, pf_employee REAL DEFAULT 0, pf_employer REAL DEFAULT 0,
      esic_employee REAL DEFAULT 0, esic_employer REAL DEFAULT 0, net_pay REAL DEFAULT 0,
      payment_mode TEXT DEFAULT 'HDFC', bank_name TEXT, bank_account TEXT, ifsc TEXT, generated_at TEXT
    )`);
    this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('min_wage_default', '511')`);
    this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('use_min_wage_ncp', '0')`);
    this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('pf_ncp_reduces_statutory_pf', '0')`);
    this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('esic_use_pf_ncp', '0')`);
    this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('workforce_module_enabled', '0')`);
    this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('direct_biometric_enabled', '0')`);
    this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('use_legacy_all_employees', '1')`);
    this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('payment_export_strict_bank', '1')`);
    this.dbSqlite.run(`INSERT OR IGNORE INTO system_settings (key, value) VALUES ('security_mode', 'testing')`);
  }
  loadAndSeed() {
    return new Promise((resolve, reject) => {
      this.dbSqlite.get(`SELECT value FROM system_settings WHERE key = 'database_seeded'`, (err, row) => {
        if (err) {
          this.dbSqlite.all(`SELECT id FROM employees`, (err2, rows) => {
            if (err2) return reject(err2);
            if (!rows || rows.length === 0) {
              this.seedDatabase().then(() => {
                this.loadAllFromSQLite().then(resolve).catch(reject);
              }).catch(reject);
            } else {
              this.loadAllFromSQLite().then(resolve).catch(reject);
            }
          });
          return;
        }
        const isSeeded = row && row.value === "1";
        if (!isSeeded) {
          console.log("Database not seeded yet, seeding default data into SQLite...");
          this.seedDatabase().then(() => {
            this.dbSqlite.run(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('database_seeded', '1')`, () => {
              this.loadAllFromSQLite().then(resolve).catch(reject);
            });
          }).catch(reject);
        } else {
          this.loadAllFromSQLite().then(resolve).catch(reject);
        }
      });
    });
  }
  async seedDatabase() {
    const defaultCompanies = [
      {
        id: "SVN-1",
        name: "SVN Opto Electronics Pvt Ltd",
        unit_name: "Unit I",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(50%2C%2050)%22%20stroke%3D%22none%22%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%22-25%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-35%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%22-25%22%20r%3D%224.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%220%22%20r%3D%225%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%225%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2235%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-25%22%20cy%2225%22%20r%3D%223.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-35%22%20cy%3D%220%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%22-15%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-20%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%22-15%22%20r%3D%223.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%220%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%2215%22%20r%3D%222.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-5%22%20cy%3D%22-5%22%20r%3D%222%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%222%22%20fill%3D%22%231B4F72%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22115%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23F07D1E%22%20letter-spacing%3D%221%22%3ESVN%3C%2Ftext%3E%3Ctext%20x%3D%22195%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22400%22%20font-size%3D%2232%22%20fill%3D%22%231B4F72%22%20letter-spacing%3D%221%22%3EOpto%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210",
        factory_address: "Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210",
        gst_number: "24AAACS9012J1Z3",
        pan_number: "AAACS9012J",
        tan_number: "BRDA01234D",
        cin_number: "U31900GJ2015PTC085123",
        pf_number: "GJ/BAR/0045621/000",
        esic_number: "37000451230001001",
        pt_number: "PEC240102034"
      },
      {
        id: "SVN-II",
        name: "SVN Opto Electronics Pvt Ltd",
        unit_name: "Unit II",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(50%2C%2050)%22%20stroke%3D%22none%22%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%22-25%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-35%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%22-25%22%20r%3D%224.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%220%22%20r%3D%225%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%225%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2235%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%2225%22%20r%3D%223.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-35%22%20cy%3D%220%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%22-15%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-20%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%22-15%22%20r%3D%223.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%220%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%2215%22%20r%3D%222.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-5%22%20cy%3D%22-5%22%20r%3D%222%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%222%22%20fill%3D%22%231B4F72%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22115%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23F07D1E%22%20letter-spacing%3D%221%22%3ESVN%3C%2Ftext%3E%3Ctext%20x%3D%22195%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22400%22%20font-size%3D%2232%22%20fill%3D%22%231B4F72%22%20letter-spacing%3D%221%22%3EOpto%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No 143/E, 143/F, 143/G & 143/H, Village Dhabhel, Daman 396210",
        factory_address: "Survey No 370 (2)/1, Premises no. - 2, Building no. 1 & 2, Kachigam, Daman 396210",
        gst_number: "24AAACS9012J2Z4",
        pan_number: "AAACS9012J",
        tan_number: "BRDA01234E",
        cin_number: "U31900GJ2015PTC085123",
        pf_number: "GJ/BAR/0045621/001",
        esic_number: "37000451230001002",
        pt_number: "PEC240102035"
      },
      {
        id: "Sakar-I",
        name: "Sakar Electricals & Electronics Pvt Ltd",
        unit_name: "Unit I",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(10%2C%2010)%22%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2240%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%204%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2230%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%226%203%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2215%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%202%22%3E%3C%2Fellipse%3E%3Cline%20x1%3D%2220%22%20y1%3D%2250%22%20x2%3D%22100%22%20y2%3D%2250%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%3E%3C%2Fline%3E%3C%2Fg%3E%3Ctext%20x%3D%22120%22%20y%3D%2252%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2219%22%20fill%3D%22%232E2E2E%22%20letter-spacing%3D%221.5%22%3ESAKAR%20ELECTRICALS%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%2274%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2212%22%20fill%3D%22%235E5E5E%22%20letter-spacing%3D%220.8%22%3E%26%20ELECTRONICS%20PVT.%20LTD.%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210",
        factory_address: "Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210",
        gst_number: "24AABCS4512A1Z1",
        pan_number: "AABCS4512A",
        tan_number: "BRDA04512A",
        cin_number: "U31900GJ2012PTC074321",
        pf_number: "GJ/BAR/0034125/000",
        esic_number: "37000341250001001",
        pt_number: "PEC240104512"
      },
      {
        id: "Sakar-III",
        name: "Sakar Electricals & Electronics Pvt Ltd",
        unit_name: "Unit III",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(10%2C%2010)%22%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2240%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%204%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2230%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%226%203%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2215%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%202%22%3E%3C%2Fellipse%3E%3Cline%20x1%3D%2220%22%20y1%3D%2250%22%20x2%3D%22100%22%20y2%3D%2250%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%3E%3C%2Fline%3E%3C%2Fg%3E%3Ctext%20x%3D%22120%22%20y%3D%2252%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2219%22%20fill%3D%22%232E2E2E%22%20letter-spacing%3D%221.5%22%3ESAKAR%20ELECTRICALS%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%2274%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2212%22%20fill%3D%22%235E5E5E%22%20letter-spacing%3D%220.8%22%3E%26%20ELECTRONICS%20PVT.%20LTD.%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No. 352/1, Vapi Kachigam Road, Kachigam, Daman-396210",
        factory_address: "Plot No 60, Daman Ganga Industrial Park, Dungra, Vapi (Gujarat)",
        gst_number: "24AABCS4512A3Z3",
        pan_number: "AABCS4512A",
        tan_number: "BRDA04512B",
        cin_number: "U31900GJ2012PTC074321",
        pf_number: "GJ/BAR/0034125/002",
        esic_number: "37000341250001002",
        pt_number: "PEC240104513"
      },
      {
        id: "Flare-1",
        name: "Flare Luminaires Pvt Ltd",
        unit_name: "Unit I",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2270%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2236%22%20fill%3D%22%23E11D48%22%3EFLARE%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210",
        factory_address: "Survey No 370/2 (6), Vapi-Kachigam Road, Kachigam, Daman 396210",
        gst_number: "24AAFCS1122K1Z9",
        pan_number: "AAFCS1122K",
        tan_number: "BRDA09988D",
        cin_number: "U72200GJ2018PTC102948",
        pf_number: "GJ/BAR/0099111/000",
        esic_number: "37000991110001001",
        pt_number: "PEC240109911"
      },
      {
        id: "Zenivo-1",
        name: "Zenivo Opto Electronics Pvt Ltd",
        unit_name: "Unit I",
        logo: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Ctext%20x%3D%2250%22%20y%3D%2270%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2236%22%20fill%3D%22%232563EB%22%3EZENIVO%3C%2Ftext%3E%3C%2Fsvg%3E",
        registered_office: "Survey No 98/8, Daman Industrial Estate, Kadlya, Daman",
        factory_address: "Survey No 98/8, Daman Industrial Estate, Kadlya, Daman",
        gst_number: "24AAZCS3344L1Z2",
        pan_number: "AAZCS3344L",
        tan_number: "BRDA07766E",
        cin_number: "U72300GJ2019PTC108247",
        pf_number: "GJ/BAR/0088222/000",
        esic_number: "37000882220001001",
        pt_number: "PEC240108822"
      }
    ];
    const defaultDepts = [
      "Production",
      "QC",
      "Maintenance",
      "Stores",
      "Purchase",
      "Accounts",
      "HR",
      "Dispatch",
      "Sales",
      "Marketing",
      "R&D",
      "Administration"
    ];
    for (const c of defaultCompanies) {
      await new Promise((resolve, reject) => {
        this.dbSqlite.run(
          `INSERT OR IGNORE INTO companies (id, name, unit_name, logo, registered_office, factory_address, gst_number, pan_number, tan_number, cin_number, pf_number, esic_number, pt_number) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.name, c.unit_name, c.logo, c.registered_office, c.factory_address, c.gst_number, c.pan_number, c.tan_number, c.cin_number, c.pf_number, c.esic_number, c.pt_number],
          (err) => err ? reject(err) : resolve()
        );
      });
    }
    for (const d of defaultDepts) {
      await new Promise((resolve, reject) => {
        this.dbSqlite.run(`INSERT OR IGNORE INTO departments (name) VALUES (?)`, [d], (err) => err ? reject(err) : resolve());
      });
    }
    for (const emp of SEED_EMPLOYEES) {
      let compCode = emp.company;
      if (compCode === "SVN-1") compCode = "SVN-1";
      else if (compCode === "SVN II" || compCode === "SVN-II") compCode = "SVN-II";
      else if (compCode === "Sakar I" || compCode === "Sakar-I") compCode = "Sakar-I";
      else if (compCode === "Sakar III" || compCode === "Sakar-III") compCode = "Sakar-III";
      const phoneStr = emp.phone ? String(emp.phone).trim() : "0000";
      const last4 = phoneStr.length >= 4 ? phoneStr.slice(-4) : phoneStr.padStart(4, "0");
      const birthYearVal = emp.birth_year || 1995;
      const defaultPass = last4 + birthYearVal;
      await new Promise((resolve, reject) => {
        this.dbSqlite.run(
          `INSERT OR IGNORE INTO employees (id, name, company, designation, department, email, phone, joining_date, status, bank_name, bank_account, ifsc, pan, uan, base_salary, hra, special_allowance, da, pf_opt_in, esic_opt_in, professional_tax_opt_in, leave_balance_pl, leave_balance_cl, leave_balance_sl, qualification, location, vehicle_detail, prev_company_name, prev_company_location, total_experience, shift_timing, password, birth_year, needs_password_change, aadhaar_number, dob, gender, marital_status, emergency_contact, blood_group, esic_number, cost_center, reporting_manager, employee_category) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            emp.id,
            emp.name,
            compCode,
            emp.designation,
            emp.department,
            emp.email,
            emp.phone,
            emp.joining_date,
            emp.status,
            emp.bank_name,
            emp.bank_account,
            emp.ifsc,
            emp.pan,
            emp.uan,
            emp.base_salary,
            emp.hra,
            emp.special_allowance,
            emp.da,
            emp.pf_opt_in ? 1 : 0,
            emp.esic_opt_in ? 1 : 0,
            emp.professional_tax_opt_in ? 1 : 0,
            18,
            6,
            6,
            emp.qualification || "B.Tech (Electrical Engineering)",
            emp.location || "Sakar Corporate Tower, Alkapuri",
            emp.vehicle_detail || "GJ-06-HM-1234 (Honda Activa)",
            emp.prev_company_name || "L&T Heavy Engineering",
            emp.prev_company_location || "Vadodara, Gujarat",
            emp.total_experience || "4 Years",
            emp.shift_timing || "8:00 AM to 5:30 PM",
            defaultPass,
            birthYearVal,
            1,
            emp.aadhaar_number || "123456789012",
            emp.dob || "1995-05-15",
            emp.gender || "Male",
            emp.marital_status || "Single",
            emp.emergency_contact || "9898989898",
            emp.blood_group || "O+",
            emp.esic_number || "37000451230001001",
            emp.cost_center || "Savli Unit I",
            emp.reporting_manager || "Rahul Sharma",
            emp.employee_category || "Staff"
          ],
          (err) => err ? reject(err) : resolve()
        );
      });
    }
    for (const a of SEED_ATTENDANCE) {
      await new Promise((resolve, reject) => {
        this.dbSqlite.run(
          `INSERT OR IGNORE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [a.id, a.employee_id, a.month, a.total_days, a.working_days, a.lop_days, a.overtime_hours],
          (err) => err ? reject(err) : resolve()
        );
      });
    }
    for (const l of SEED_LEAVES) {
      await new Promise((resolve, reject) => {
        this.dbSqlite.run(
          `INSERT OR IGNORE INTO leave_applications (id, employee_id, employee_name, company, leave_type, start_date, end_date, days, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [l.id, l.employee_id, l.employee_name, l.company, l.leave_type, l.start_date, l.end_date, l.days, l.reason, l.status],
          (err) => err ? reject(err) : resolve()
        );
      });
    }
    await this.prepopulatePayslips();
  }
  prepopulatePayslips() {
    return new Promise((resolve, reject) => {
      const month = "2026-05";
      const computedSlips = [];
      let gross_total = 0;
      let deduct_total = 0;
      let net_total = 0;
      this.dbSqlite.all(`SELECT * FROM employees`, (err, rows) => {
        if (err) return reject(err);
        const employees = rows.map((r) => ({
          ...r,
          pf_opt_in: r.pf_opt_in === 1,
          esic_opt_in: r.esic_opt_in === 1,
          professional_tax_opt_in: r.professional_tax_opt_in === 1,
          needs_password_change: r.needs_password_change === 1,
          conveyance_allowance: r.conveyance_allowance ?? 0,
          edu_allowance: r.edu_allowance ?? 0,
          medical_allowance: r.medical_allowance ?? 0,
          hidden_salary_heads: r.hidden_salary_heads || "",
          salary_structure_type: r.salary_structure_type || "FIXED",
          is_hod: r.is_hod === 1,
          can_approve_leave: r.can_approve_leave === 1,
          can_approve_misspunch: r.can_approve_misspunch === 1,
          reporting_hod_code: r.reporting_hod_code || r.reporting_hod || "",
          photo: r.photo || ""
        }));
        this.dbSqlite.all(`SELECT * FROM attendance WHERE month = ?`, [month], (err2, attRows) => {
          if (err2) return reject(err2);
          for (const emp of employees) {
            const att = attRows.find((a) => a.employee_id === emp.id) || {
              total_days: 31,
              working_days: 31,
              lop_days: 0,
              overtime_hours: 0
            };
            const slip = this.calculateSingleSlip(emp, att, month);
            computedSlips.push(slip);
            gross_total += slip.gross_salary;
            deduct_total += slip.total_deductions;
            net_total += slip.net_salary;
          }
          this.dbSqlite.serialize(() => {
            const runId = `RUN-${month}`;
            this.dbSqlite.run(
              `INSERT OR REPLACE INTO payroll_runs (id, month, status, processed_at, total_employees, total_gross, total_deductions, total_net) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [runId, month, "CLOSED", (/* @__PURE__ */ new Date()).toISOString(), computedSlips.length, gross_total, deduct_total, net_total]
            );
            for (const s of computedSlips) {
              this.dbSqlite.run(
                `INSERT OR REPLACE INTO payslips (id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month, rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance, earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance, overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction, salary_advance, gross_salary, total_deductions, net_salary, employer_pf, employer_esic, hidden_salary_heads, salary_structure_type, pay_days, calendar_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  s.id,
                  s.employee_id,
                  s.employee_name,
                  s.designation,
                  s.department,
                  s.pan,
                  s.uan,
                  s.bank_name,
                  s.bank_account,
                  s.ifsc,
                  s.month,
                  s.rate_base_salary,
                  s.rate_hra,
                  s.rate_special_allowance,
                  s.rate_da,
                  s.rate_edu_allowance || 0,
                  s.rate_medical_allowance || 0,
                  s.rate_conveyance_allowance || 0,
                  s.earned_base_salary,
                  s.earned_hra,
                  s.earned_special_allowance,
                  s.earned_da,
                  s.earned_edu_allowance || 0,
                  s.earned_medical_allowance || 0,
                  s.earned_conveyance_allowance || 0,
                  s.overtime_pay,
                  s.lop_deduction,
                  s.pf_deduction,
                  s.esic_deduction,
                  s.professional_tax,
                  s.tds,
                  s.custom_deductions,
                  s.loan_deduction,
                  s.salary_advance || 0,
                  s.gross_salary,
                  s.total_deductions,
                  s.net_salary,
                  s.employer_pf,
                  s.employer_esic,
                  s.hidden_salary_heads || null,
                  s.salary_structure_type || "FIXED",
                  s.pay_days || 0,
                  s.calendar_days || 30
                ]
              );
            }
            resolve();
          });
        });
      });
    });
  }
  loadAllFromSQLite() {
    if (this.inMemoryOnly || this.dbSqlite && this.dbSqlite.constructor.name === "MockDatabase") {
      console.log("[loadAllFromSQLite] SQLite is running in Mock/In-Memory mode; bypassing loading from SQLite to preserve cached in-memory data.");
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      this.dbSqlite.serialize(() => {
        const p1 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM employees`, (err, rows) => {
            if (err) return rej(err);
            const mapped = rows.map((r) => {
              const baseEmp = {
                ...r,
                da: 0,
                pf_opt_in: r.pf_opt_in === 1,
                esic_opt_in: r.esic_opt_in === 1,
                professional_tax_opt_in: r.professional_tax_opt_in === 1,
                needs_password_change: r.needs_password_change === 1,
                conveyance_allowance: r.conveyance_allowance ?? 0,
                edu_allowance: r.edu_allowance ?? 0,
                medical_allowance: r.medical_allowance ?? 0,
                bonus_payable: r.bonus_payable ?? 0,
                hidden_salary_heads: r.hidden_salary_heads || "",
                salary_structure_type: r.salary_structure_type || "FIXED",
                is_hod: r.is_hod === 1,
                can_approve_leave: r.can_approve_leave === 1,
                can_approve_misspunch: r.can_approve_misspunch === 1,
                reporting_hod_code: r.reporting_hod_code || r.reporting_hod || "",
                photo: r.photo || ""
              };
              baseEmp.ctc_salary = this.computeCtcForEmployee(baseEmp);
              return baseEmp;
            });
            res(mapped);
          });
        });
        const p2 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM attendance`, (err, rows) => err ? rej(err) : res(rows));
        });
        const p3 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM payroll_runs`, (err, rows) => err ? rej(err) : res(rows));
        });
        const p4 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM payslips`, (err, rows) => err ? rej(err) : res(rows));
        });
        const p5 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM leave_applications`, (err, rows) => err ? rej(err) : res(rows));
        });
        const p6 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM ff_settlements`, (err, rows) => err ? rej(err) : res(rows));
        });
        const p7 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM loans`, (err, rows) => {
            if (err) return rej(err);
            const mapped = (rows || []).map((r) => {
              let skipped_months = [];
              let additional_loans = [];
              try {
                skipped_months = r.skipped_months ? JSON.parse(r.skipped_months) : [];
              } catch {
              }
              try {
                additional_loans = r.additional_loans ? JSON.parse(r.additional_loans) : [];
              } catch {
              }
              return {
                ...r,
                opening_balance: r.opening_balance !== null && r.opening_balance !== void 0 ? Number(r.opening_balance) : Number(r.amount || 0),
                opening_date: r.opening_date || "2026-04-01",
                skipped_months: Array.isArray(skipped_months) ? skipped_months : [],
                additional_loans: Array.isArray(additional_loans) ? additional_loans : []
              };
            });
            res(mapped);
          });
        });
        const p8 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT name FROM departments`, (err, rows) => err ? rej(err) : res(rows.map((r) => r.name)));
        });
        const p9 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM companies`, (err, rows) => {
            if (err) return rej(err);
            const mapped = (rows || []).map((r) => {
              let logo = r.logo;
              if (r.id === "SVN-1" || r.id === "SVN-II") {
                if (!r.logo || r.logo.includes("unsplash.com")) {
                  logo = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(50%2C%2050)%22%20stroke%3D%22none%22%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%22-25%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-35%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%22-25%22%20r%3D%224.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2235%22%20cy%3D%220%22%20r%3D%225%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2225%22%20cy%3D%2225%22%20r%3D%225%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2235%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-25%22%20cy%3D%2225%22%20r%3D%223.5%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-35%22%20cy%3D%220%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%22-15%22%20r%3D%223%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%22-20%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%22-15%22%20r%3D%223.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%220%22%20r%3D%224%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%224%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%220%22%20cy%3D%2220%22%20r%3D%223%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%22-15%22%20cy%3D%2215%22%20r%3D%222.5%22%20fill%3D%22%231B4F72%22%2F%3E%3Ccircle%20cx%3D%22-5%22%20cy%3D%22-5%22%20r%3D%222%22%20fill%3D%22%23F07D1E%22%2F%3E%3Ccircle%20cx%3D%225%22%20cy%3D%225%22%20r%3D%222%22%20fill%3D%22%231B4F72%22%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%22115%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2232%22%20fill%3D%22%23F07D1E%22%20letter-spacing%3D%221%22%3ESVN%3C%2Ftext%3E%3Ctext%20x%3D%22195%22%20y%3D%2262%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22400%22%20font-size%3D%2232%22%20fill%3D%22%231B4F72%22%20letter-spacing%3D%221%22%3EOpto%3C%2Ftext%3E%3C%2Fsvg%3E";
                  this.dbSqlite.run(`UPDATE companies SET logo = ? WHERE id = ?`, [logo, r.id]);
                }
              } else if (r.id === "Sakar-I" || r.id === "Sakar-III") {
                if (!r.logo || r.logo.includes("unsplash.com")) {
                  logo = "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20400%20120%22%20width%3D%22100%25%22%20height%3D%22100%25%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22none%22%2F%3E%3Cg%20transform%3D%22translate(10%2C%2010)%22%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2240%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%224%22%20stroke-dasharray%3D%228%204%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2230%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%20stroke-dasharray%3D%226%203%22%3E%3C%2Fellipse%3E%3Cellipse%20cx%3D%2260%22%20cy%3D%2250%22%20rx%3D%2215%22%20ry%3D%2225%22%20fill%3D%22none%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%224%202%22%3E%3C%2Fellipse%3E%3Cline%20x1%3D%2220%22%20y1%3D%2250%22%20x2%3D%22100%22%20y2%3D%2250%22%20stroke%3D%22%23F07D1E%22%20stroke-width%3D%223%22%3E%3C%2Fline%3E%3C%2Fg%3E%3Ctext%20x%3D%22120%22%20y%3D%2252%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22900%22%20font-size%3D%2219%22%20fill%3D%22%232E2E2E%22%20letter-spacing%3D%221.5%22%3ESAKAR%20ELECTRICALS%3C%2Ftext%3E%3Ctext%20x%3D%22120%22%20y%3D%2274%22%20font-family%3D%22%27Inter%27%2C%20sans-serif%22%20font-weight%3D%22800%22%20font-size%3D%2212%22%20fill%3D%22%235E5E5E%22%20letter-spacing%3D%220.8%22%3E%26%20ELECTRONICS%20PVT.%20LTD.%3C%2Ftext%3E%3C%2Fsvg%3E";
                  this.dbSqlite.run(`UPDATE companies SET logo = ? WHERE id = ?`, [logo, r.id]);
                }
              }
              return { ...r, logo };
            });
            res(mapped);
          });
        });
        const p10 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM salary_revisions`, (err, rows) => err ? rej(err) : res(rows));
        });
        const p11 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM assets`, (err, rows) => err ? rej(err) : res(rows || []));
        });
        const p12 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM travel_reimbursements`, (err, rows) => err ? rej(err) : res(rows || []));
        });
        const p13 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM broadcasts`, (err, rows) => err ? rej(err) : res(rows || []));
        });
        const p14 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM attendance_corrections`, (err, rows) => err ? rej(err) : res(rows || []));
        });
        const p15 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM compoff_requests`, (err, rows) => err ? rej(err) : res(rows || []));
        });
        const p16 = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM overtime_requests`, (err, rows) => err ? rej(err) : res(rows || []));
        });
        const pUsers = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM users`, (err, rows) => {
            if (err) return rej(err);
            const mapped = (rows || []).map((r) => ({
              ...r,
              company_rights: r.company_rights ? JSON.parse(r.company_rights) : [],
              disabled: r.disabled === 1
            }));
            res(mapped);
          });
        });
        const pHods = new Promise((res, rej) => {
          this.dbSqlite.all(`SELECT * FROM hods`, (err, rows) => {
            if (err) return rej(err);
            const mapped = (rows || []).map((r) => ({
              ...r,
              active: r.active === 1
            }));
            res(mapped);
          });
        });
        const pLedger = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM compoff_ledger`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pPolicies = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM policies`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pAcks = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM policy_acknowledgements`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pGatePasses = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM gate_passes`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pShifts = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM shifts`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pContractors = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM contractors`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pMinWage = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM minimum_wage_rates`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pCBills = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM contractor_bills`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pCBillLines = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM contractor_bill_lines`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pCheques = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM cheque_payments`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pMonthStatus = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM month_status`, (err, rows) => err ? res([]) : res(rows || []));
        });
        const pBatches = new Promise((res) => {
          this.dbSqlite.all(`SELECT * FROM attendance_upload_batches`, (err, rows) => err ? res([]) : res(rows || []));
        });
        Promise.all([p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, pUsers, pHods, pLedger, pPolicies, pAcks, pGatePasses, pShifts, pContractors, pMinWage, pCBills, pCBillLines, pCheques, pMonthStatus, pBatches]).then(([emps, atts, runs, slips, leaves, ffs, loans, depts, companies, revisions, assets, travel, broadcasts, corrections, compoffs, overtimes, users, hods, ledger, pols, acks, gatePasses, sfts, contractorsList, minWageList, cBills, cBillLines, cheques, monthStatus, batches]) => {
          this.data = {
            employees: emps,
            attendance: atts,
            payroll_runs: runs,
            payslips: slips,
            leave_applications: leaves,
            ff_settlements: (ffs || []).map((f) => {
              if (f.meta_json) {
                try {
                  const parsed = JSON.parse(f.meta_json);
                  return { ...f, ...parsed };
                } catch {
                  return f;
                }
              }
              return f;
            }),
            loans,
            departments: depts,
            companies,
            salary_revisions: revisions,
            audit_logs: this.data.audit_logs,
            assets,
            travel_reimbursements: travel,
            broadcasts,
            attendance_corrections: corrections,
            compoff_requests: compoffs,
            overtime_requests: overtimes,
            users,
            hods,
            compoff_ledger: ledger,
            policies: pols,
            policy_acknowledgements: acks,
            gate_passes: gatePasses,
            shifts: sfts,
            // Workforce module (Phase A — foundation)
            contractors: contractorsList,
            contractor_bills: cBills,
            contractor_bill_lines: cBillLines,
            cheque_payments: cheques,
            minimum_wage_rates: minWageList,
            month_status: monthStatus,
            attendance_upload_batches: batches
          };
          resolve();
        }).catch(reject);
      });
    });
  }
  syncUser(user) {
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO users (id, username, name, role, company_rights, title, password, disabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.username,
        user.name,
        user.role,
        JSON.stringify(user.company_rights),
        user.title || null,
        user.password || "password123",
        user.disabled ? 1 : 0
      ],
      (err) => {
        if (err) console.error("SQLite Sync Error on Users:", err);
      }
    );
    if (!this.data.users) this.data.users = [];
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.persistData();
  }
  deleteUser(id) {
    this.dbSqlite.run(`DELETE FROM users WHERE id = ?`, [id], (err) => {
      if (err) console.error("SQLite Delete Error on Users:", err);
    });
    if (this.data.users) {
      this.data.users = this.data.users.filter((u) => u.id !== id);
    }
    this.persistData();
  }
  getHods() {
    return this.data.hods || [];
  }
  syncHod(hod) {
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO hods (id, name, department, company, active) VALUES (?, ?, ?, ?, ?)`,
      [
        hod.id,
        hod.name,
        hod.department,
        hod.company,
        hod.active ? 1 : 0
      ],
      (err) => {
        if (err) console.error("SQLite Sync Error on HODs:", err);
      }
    );
    if (!this.data.hods) this.data.hods = [];
    const idx = this.data.hods.findIndex((h) => h.id === hod.id);
    if (idx !== -1) {
      this.data.hods[idx] = hod;
    } else {
      this.data.hods.push(hod);
    }
    this.persistData();
  }
  deleteHod(id) {
    this.dbSqlite.run(`DELETE FROM hods WHERE id = ?`, [id], (err) => {
      if (err) console.error("SQLite Delete Error on HODs:", err);
    });
    if (this.data.hods) {
      this.data.hods = this.data.hods.filter((h) => h.id !== id);
    }
    this.persistData();
  }
  getShifts() {
    if (!this.data.shifts) this.data.shifts = [];
    return this.data.shifts;
  }
  syncShift(shift) {
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO shifts (code, name, start_time, end_time, grace_time, weekly_off) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        shift.code.trim().toUpperCase(),
        shift.name,
        shift.start_time,
        shift.end_time,
        Number(shift.grace_time || 0),
        shift.weekly_off || "Sunday"
      ],
      (err) => {
        if (err) console.error("SQLite Sync Error on Shifts:", err);
      }
    );
    if (!this.data.shifts) this.data.shifts = [];
    const idx = this.data.shifts.findIndex((s) => s.code.toUpperCase() === shift.code.trim().toUpperCase());
    const cleanShift = {
      code: shift.code.trim().toUpperCase(),
      name: shift.name,
      start_time: shift.start_time,
      end_time: shift.end_time,
      grace_time: Number(shift.grace_time || 0),
      weekly_off: shift.weekly_off || "Sunday"
    };
    if (idx !== -1) {
      this.data.shifts[idx] = cleanShift;
    } else {
      this.data.shifts.push(cleanShift);
    }
    this.persistData();
  }
  deleteShift(code) {
    this.dbSqlite.run(`DELETE FROM shifts WHERE code = ?`, [code.toUpperCase()]);
    if (this.data.shifts) {
      this.data.shifts = this.data.shifts.filter((s) => s.code.toUpperCase() !== code.toUpperCase());
      this.persistData();
      return true;
    }
    return false;
  }
  /** Standardize employee name to Proper Case: "First Middle Last" */
  standardizeName(name) {
    if (!name) return name;
    return name.trim().replace(/\s+/g, " ").split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  }
  syncEmployee(emp) {
    emp.name = this.standardizeName(emp.name);
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO employees (id, name, company, designation, department, email, phone, joining_date, exit_date, status, bank_name, bank_account, ifsc, pan, uan, base_salary, hra, special_allowance, da, pf_opt_in, esic_opt_in, professional_tax_opt_in, leave_balance_pl, leave_balance_cl, leave_balance_sl, qualification, location, vehicle_detail, prev_company_name, prev_company_location, total_experience, shift_timing, password, birth_year, needs_password_change, aadhaar_number, dob, gender, marital_status, emergency_contact, blood_group, esic_number, cost_center, reporting_manager, employee_category, reporting_hod, reporting_hod_name, conveyance_allowance, edu_allowance, medical_allowance, hidden_salary_heads, salary_structure_type, bonus_payable, ctc_salary, reporting_hod_code, is_hod, can_approve_leave, can_approve_misspunch, photo, pf_member_id, form_11_status, form_11_file, pf_non_deduction_reason, pf_verified_by, pf_verification_date, pf_hr_remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emp.id,
        emp.name,
        emp.company,
        emp.designation,
        emp.department,
        emp.email,
        emp.phone,
        emp.joining_date,
        emp.exit_date || null,
        emp.status,
        emp.bank_name,
        emp.bank_account,
        emp.ifsc,
        emp.pan,
        emp.uan,
        emp.base_salary,
        emp.hra,
        emp.special_allowance,
        emp.da,
        emp.pf_opt_in ? 1 : 0,
        emp.esic_opt_in ? 1 : 0,
        emp.professional_tax_opt_in ? 1 : 0,
        emp.leave_balance_pl,
        emp.leave_balance_cl,
        emp.leave_balance_sl,
        emp.qualification || null,
        emp.location || null,
        emp.vehicle_detail || null,
        emp.prev_company_name || null,
        emp.prev_company_location || null,
        emp.total_experience || null,
        emp.shift_timing || null,
        emp.password || null,
        emp.birth_year || null,
        emp.needs_password_change ? 1 : 0,
        emp.aadhaar_number || null,
        emp.dob || null,
        emp.gender || null,
        emp.marital_status || null,
        emp.emergency_contact || null,
        emp.blood_group || null,
        emp.esic_number || null,
        emp.cost_center || null,
        emp.reporting_manager || null,
        emp.employee_category || null,
        emp.reporting_hod || null,
        emp.reporting_hod_name || null,
        emp.conveyance_allowance ?? 0,
        emp.edu_allowance ?? 0,
        emp.medical_allowance ?? 0,
        emp.hidden_salary_heads || null,
        emp.salary_structure_type || "FIXED",
        emp.bonus_payable ?? 0,
        emp.ctc_salary ?? 0,
        emp.reporting_hod_code || emp.reporting_hod || null,
        emp.is_hod ? 1 : 0,
        emp.can_approve_leave ? 1 : 0,
        emp.can_approve_misspunch ? 1 : 0,
        emp.photo || null,
        emp.pf_member_id || null,
        emp.form_11_status || "Pending",
        emp.form_11_file || null,
        emp.pf_non_deduction_reason || null,
        emp.pf_verified_by || null,
        emp.pf_verification_date || null,
        emp.pf_hr_remarks || null
      ],
      (err) => {
        if (err) console.error("SQLite Sync Error on Employees:", err);
      }
    );
  }
  deleteEmployeeSQLite(id) {
    this.dbSqlite.run(`DELETE FROM employees WHERE id = ?`, [id]);
    this.dbSqlite.run(`DELETE FROM attendance WHERE employee_id = ?`, [id]);
    this.dbSqlite.run(`DELETE FROM payslips WHERE employee_id = ?`, [id]);
    this.dbSqlite.run(`DELETE FROM leave_applications WHERE employee_id = ?`, [id]);
    this.dbSqlite.run(`DELETE FROM ff_settlements WHERE employee_id = ?`, [id]);
    this.dbSqlite.run(`DELETE FROM loans WHERE employee_id = ?`, [id]);
  }
  // Employee methods
  getEmployees(companyFilter) {
    const activeEmps = this.data.employees || [];
    if (companyFilter && companyFilter !== "ALL") {
      return activeEmps.filter((e) => e.company === companyFilter);
    }
    return activeEmps;
  }
  getCompanySettings(companyId) {
    const DEFAULT_SETTINGS = {
      salary_base_percent: 50,
      salary_hra_percent: 40,
      salary_da_percent: 0,
      salary_special_percent: 15,
      salary_edu_percent: 2,
      salary_medical_percent: 5,
      salary_conveyance_percent: 8,
      pf_opt_in_default: true,
      pf_employer_rate: 12,
      esic_opt_in_threshold: 21e3,
      esic_employer_rate: 3.25,
      bonus_rate_percent: 8.33
    };
    const c = this.data.companies?.find((co) => co.id === companyId);
    if (c && c.settings) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(c.settings) };
      } catch (e) {
      }
    }
    return DEFAULT_SETTINGS;
  }
  computeCtcForEmployee(emp) {
    const base = emp.base_salary;
    const sets = this.getCompanySettings(emp.company);
    const hiddenHeads = (emp.hidden_salary_heads || "").split(",").map((h) => h.trim());
    const isHidden = (head) => hiddenHeads.includes(head);
    const rate_hra = isHidden("hra") ? 0 : emp.salary_structure_type === "PERCENTAGE" ? Math.round(base * (sets.salary_hra_percent / 100)) : emp.hra ?? 0;
    const rate_special = isHidden("special_allowance") ? 0 : emp.salary_structure_type === "PERCENTAGE" ? Math.round(base * (sets.salary_special_percent / 100)) : emp.special_allowance ?? 0;
    const rate_da = 0;
    const rate_edu = isHidden("edu_allowance") ? 0 : emp.salary_structure_type === "PERCENTAGE" ? Math.round(base * (sets.salary_edu_percent || 2) / 100) : emp.edu_allowance && emp.edu_allowance > 0 ? emp.edu_allowance : Math.round(base * (sets.salary_edu_percent || 2) / 100);
    const rate_medical = isHidden("medical_allowance") ? 0 : emp.salary_structure_type === "PERCENTAGE" ? Math.round(base * (sets.salary_medical_percent || 5) / 100) : emp.medical_allowance && emp.medical_allowance > 0 ? emp.medical_allowance : Math.round(base * (sets.salary_medical_percent || 5) / 100);
    const rate_conveyance = isHidden("conveyance_allowance") ? 0 : emp.salary_structure_type === "PERCENTAGE" ? Math.round(base * (sets.salary_conveyance_percent || 8) / 100) : emp.conveyance_allowance && emp.conveyance_allowance > 0 ? emp.conveyance_allowance : Math.round(base * (sets.salary_conveyance_percent || 8) / 100);
    const rate_bonus = Math.round(base * 0.0833);
    const gross = base + rate_hra + rate_special + rate_da + rate_edu + rate_medical + rate_conveyance;
    const employer_pf = emp.pf_opt_in ? Math.round(base * (sets.pf_employer_rate / 100)) : 0;
    const employer_esic = emp.esic_opt_in && gross <= sets.esic_opt_in_threshold ? Math.round(gross * (sets.esic_employer_rate / 100)) : 0;
    return gross + employer_pf + employer_esic + rate_bonus;
  }
  insertEmployee(employee) {
    if (!employee.id || !employee.id.trim()) {
      throw new Error("Employee Code is a mandatory field and must be entered as per existing company records.");
    }
    const cleanId = employee.id.trim();
    if (this.data.employees.some((e) => e.id.toLowerCase() === cleanId.toLowerCase())) {
      throw new Error(`Duplicate Employee Code error: Code "${cleanId}" already exists in organization records.`);
    }
    employee.id = cleanId;
    if (!employee.company) employee.company = "SVN-1";
    if (!employee.status) employee.status = "ACTIVE";
    if (employee.leave_balance_pl === void 0) employee.leave_balance_pl = 18;
    if (employee.leave_balance_cl === void 0) employee.leave_balance_cl = 6;
    if (employee.leave_balance_sl === void 0) employee.leave_balance_sl = 6;
    const phoneStr = employee.phone ? String(employee.phone).trim() : "0000";
    const last4 = phoneStr.length >= 4 ? phoneStr.slice(-4) : phoneStr.padStart(4, "0");
    const birthYearVal = employee.birth_year ? String(employee.birth_year).trim() : "1995";
    employee.password = last4 + birthYearVal;
    employee.needs_password_change = true;
    employee.ctc_salary = this.computeCtcForEmployee(employee);
    this.data.employees.push(employee);
    this.syncEmployee(employee);
    this.persistData();
    return employee;
  }
  updateEmployee(id, updated) {
    const idx = this.data.employees.findIndex((e) => e.id === id);
    if (idx === -1) return void 0;
    if (updated.name) updated.name = this.standardizeName(updated.name);
    const oldEmp = this.data.employees[idx];
    const oldSalary = oldEmp.base_salary;
    const newSalary = updated.base_salary;
    if (newSalary !== void 0 && Number(newSalary) !== Number(oldSalary)) {
      this.addSalaryRevision({
        employee_code: id,
        old_salary: Number(oldSalary),
        new_salary: Number(newSalary),
        effective_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        reason: "Salary Revision / Increment",
        approved_by: "Group HR Director"
      });
    }
    const newId = updated.id ? updated.id.trim() : void 0;
    const idChanged = newId && newId !== id;
    if (idChanged) {
      if (this.data.employees.some((e) => e.id.toLowerCase() === newId.toLowerCase())) {
        throw new Error(`Duplicate Employee Code error: Code "${newId}" already exists in organization records.`);
      }
      this.data.attendance.forEach((a) => {
        if (a.employee_id === id) a.employee_id = newId;
      });
      this.data.payslips.forEach((p) => {
        if (p.employee_id === id) p.employee_id = newId;
      });
      if (this.data.leave_applications) {
        this.data.leave_applications.forEach((l) => {
          if (l.employee_id === id) l.employee_id = newId;
        });
      }
      if (this.data.ff_settlements) {
        this.data.ff_settlements.forEach((f) => {
          if (f.employee_id === id) f.employee_id = newId;
        });
      }
      if (this.data.loans) {
        this.data.loans.forEach((l) => {
          if (l.employee_id === id) l.employee_id = newId;
        });
      }
      if (this.data.salary_revisions) {
        this.data.salary_revisions.forEach((sr) => {
          if (sr.employee_code === id) sr.employee_code = newId;
        });
      }
      if (this.data.attendance_corrections) {
        this.data.attendance_corrections.forEach((ac) => {
          if (ac.employee_id === id) ac.employee_id = newId;
        });
      }
      if (this.data.compoff_requests) {
        this.data.compoff_requests.forEach((cr) => {
          if (cr.employee_id === id) cr.employee_id = newId;
        });
      }
      if (this.data.overtime_requests) {
        this.data.overtime_requests.forEach((ot) => {
          if (ot.employee_id === id) ot.employee_id = newId;
        });
      }
      this.dbSqlite.run(`UPDATE employees SET id = ? WHERE id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE attendance SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE payslips SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE leave_applications SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE loans SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE salary_revisions SET employee_code = ? WHERE employee_code = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE ff_settlements SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE attendance_corrections SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE compoff_requests SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
      this.dbSqlite.run(`UPDATE overtime_requests SET employee_id = ? WHERE employee_id = ?`, [newId, id]);
    }
    const mergedPartial = { ...updated };
    if (idChanged) {
      mergedPartial.id = newId;
    }
    this.data.employees[idx] = { ...this.data.employees[idx], ...mergedPartial };
    const emp = this.data.employees[idx];
    emp.pf_opt_in = emp.pf_opt_in === 1 || emp.pf_opt_in === true;
    emp.esic_opt_in = emp.esic_opt_in === 1 || emp.esic_opt_in === true;
    emp.professional_tax_opt_in = emp.professional_tax_opt_in === 1 || emp.professional_tax_opt_in === true;
    this.data.employees[idx].ctc_salary = this.computeCtcForEmployee(this.data.employees[idx]);
    this.syncEmployee(this.data.employees[idx]);
    this.persistData();
    if (idChanged) {
      this.dbSqlite.run(`DELETE FROM employees WHERE id = ?`, [id]);
    }
    return this.data.employees[idx];
  }
  deleteEmployee(id, force = false) {
    const idx = this.data.employees.findIndex((e) => e.id === id);
    if (idx === -1) return "NOT_FOUND";
    const emp = this.data.employees[idx];
    const hasPayrollHistory = this.data.payslips && this.data.payslips.some((p) => p.employee_id === id);
    if (hasPayrollHistory && !force) {
      emp.status = "SEPARATED";
      this.syncEmployee(emp);
      this.persistData();
      return "INACTIVATED";
    } else {
      this.data.employees.splice(idx, 1);
      this.data.attendance = this.data.attendance.filter((a) => a.employee_id !== id);
      this.data.payslips = this.data.payslips.filter((p) => p.employee_id !== id);
      this.data.leave_applications = this.data.leave_applications.filter((l) => l.employee_id !== id);
      this.data.ff_settlements = this.data.ff_settlements.filter((f) => f.employee_id !== id);
      this.data.loans = (this.data.loans || []).filter((l) => l.employee_id !== id);
      this.deleteEmployeeSQLite(id);
      this.persistData();
      return "PURGED";
    }
  }
  getLoans(employeeId) {
    if (!this.data.loans) this.data.loans = [];
    if (employeeId) {
      return this.data.loans.filter((l) => l.employee_id === employeeId);
    }
    return this.data.loans;
  }
  getLoanPolicy() {
    if (!this.data.loan_policy) {
      this.data.loan_policy = {
        max_amount: 3e5,
        eligibility: "Minimum 1 Year of Continuous Service",
        interest_rate: 0,
        repayment_options: "Standard 6 to 12 Months EMI Repayment (Maximum 12 Months Limit)"
      };
    }
    return this.data.loan_policy;
  }
  updateLoanPolicy(policy) {
    this.data.loan_policy = {
      ...this.getLoanPolicy(),
      ...policy
    };
    this.persistData();
  }
  addLoan(loan) {
    if (!this.data.loans) this.data.loans = [];
    const emp = this.getEmployeeById(loan.employee_id);
    const opening_balance = loan.opening_balance !== void 0 ? Number(loan.opening_balance) : Number(loan.amount || 0);
    const opening_date = loan.opening_date || "2026-04-01";
    const count = this.data.loans.length + 1;
    const yearStr = (/* @__PURE__ */ new Date()).getFullYear().toString();
    const generatedLoanNum = `LN-${yearStr}-${String(count).padStart(3, "0")}`;
    const loan_number = loan.loan_number || generatedLoanNum;
    const initialAudit = {
      id: `AUD-${Date.now()}`,
      date: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 16),
      action: "LOAN_ISSUED",
      details: `Loan ${loan_number} issued for \u20B9${loan.amount} (${loan.loan_type || "Employee Loan"}). EMI: \u20B9${loan.monthly_deduction}`,
      performed_by: loan.approval_authority || "HR Admin"
    };
    const newLoan = {
      ...loan,
      loan_number,
      department: loan.department || (emp ? emp.department : ""),
      company: loan.company || (emp ? emp.company : ""),
      unit: loan.unit || (emp ? emp.company : ""),
      loan_type: loan.loan_type || "Employee Loan",
      loan_date: loan.loan_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      interest_rate: loan.interest_rate !== void 0 ? Number(loan.interest_rate) : 0,
      emi_start_month: loan.emi_start_month || loan.month || "2026-04",
      total_installments: loan.total_installments || Math.ceil(Number(loan.amount || 0) / (Number(loan.monthly_deduction) || 1)),
      opening_balance,
      opening_date,
      employee_name: loan.employee_name || (emp ? emp.name : "Unknown"),
      id: `LOAN-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      skipped_months: loan.skipped_months || [],
      additional_loans: loan.additional_loans || [],
      settlements: loan.settlements || [],
      audit_trail: [initialAudit],
      guarantor1_id: loan.guarantor1_id || "",
      guarantor1_code: loan.guarantor1_code || "",
      guarantor1_name: loan.guarantor1_name || "",
      guarantor1_department: loan.guarantor1_department || "",
      guarantor1_monthly_salary: loan.guarantor1_monthly_salary || 0,
      guarantor1_guarantee_limit: loan.guarantor1_guarantee_limit || 0,
      guarantor2_id: loan.guarantor2_id || "",
      guarantor2_code: loan.guarantor2_code || "",
      guarantor2_name: loan.guarantor2_name || "",
      guarantor2_department: loan.guarantor2_department || "",
      guarantor2_monthly_salary: loan.guarantor2_monthly_salary || 0,
      guarantor2_guarantee_limit: loan.guarantor2_guarantee_limit || 0
    };
    this.data.loans.push(newLoan);
    this.dbSqlite.run(
      `INSERT INTO loans (id, employee_id, employee_name, amount, month, monthly_deduction, reason, status, opening_balance, opening_date, skipped_months, additional_loans, loan_number, loan_type, interest_rate, total_installments, emi_start_month, approval_authority, remarks, settlements, audit_trail, guarantor1_id, guarantor1_code, guarantor1_name, guarantor1_department, guarantor1_monthly_salary, guarantor1_guarantee_limit, guarantor2_id, guarantor2_code, guarantor2_name, guarantor2_department, guarantor2_monthly_salary, guarantor2_guarantee_limit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newLoan.id,
        newLoan.employee_id,
        newLoan.employee_name,
        newLoan.amount,
        newLoan.month,
        newLoan.monthly_deduction,
        newLoan.reason,
        newLoan.status,
        opening_balance,
        opening_date,
        JSON.stringify(newLoan.skipped_months || []),
        JSON.stringify(newLoan.additional_loans || []),
        newLoan.loan_number,
        newLoan.loan_type,
        newLoan.interest_rate,
        newLoan.total_installments,
        newLoan.emi_start_month,
        newLoan.approval_authority || "",
        newLoan.remarks || "",
        JSON.stringify(newLoan.settlements || []),
        JSON.stringify(newLoan.audit_trail || []),
        newLoan.guarantor1_id || "",
        newLoan.guarantor1_code || "",
        newLoan.guarantor1_name || "",
        newLoan.guarantor1_department || "",
        newLoan.guarantor1_monthly_salary || 0,
        newLoan.guarantor1_guarantee_limit || 0,
        newLoan.guarantor2_id || "",
        newLoan.guarantor2_code || "",
        newLoan.guarantor2_name || "",
        newLoan.guarantor2_department || "",
        newLoan.guarantor2_monthly_salary || 0,
        newLoan.guarantor2_guarantee_limit || 0
      ],
      (err) => {
        if (err) console.error("SQLite Sync Error on Loans:", err);
      }
    );
    this.persistData();
    return newLoan;
  }
  settleLoan(loanId, settlementData) {
    if (!this.data.loans) this.data.loans = [];
    const idx = this.data.loans.findIndex((l) => l.id === loanId);
    if (idx === -1) return null;
    const loan = this.data.loans[idx];
    const settlements = Array.isArray(loan.settlements) ? [...loan.settlements] : [];
    const newSettlementsItem = {
      id: `STL-${Date.now()}`,
      date: settlementData.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      amount: Number(settlementData.amount),
      recovery_type: settlementData.recovery_type,
      payment_mode: settlementData.payment_mode,
      reference_number: settlementData.reference_number || "",
      approved_by: settlementData.approved_by || "HR Admin",
      remarks: settlementData.remarks || "",
      principal_paid: Number(settlementData.amount)
    };
    settlements.push(newSettlementsItem);
    loan.settlements = settlements;
    const auditTrail = Array.isArray(loan.audit_trail) ? [...loan.audit_trail] : [];
    const auditItem = {
      id: `AUD-${Date.now()}`,
      date: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 16),
      action: settlementData.recovery_type === "FULL_SETTLEMENT" ? "FULL_FORECLOSURE" : "PARTIAL_SETTLEMENT",
      details: `${settlementData.recovery_type} of \u20B9${settlementData.amount} received via ${settlementData.payment_mode}. Ref: ${settlementData.reference_number || "N/A"}`,
      performed_by: settlementData.approved_by || "HR Admin"
    };
    auditTrail.push(auditItem);
    loan.audit_trail = auditTrail;
    const slips = this.getPayslipsByEmployee(loan.employee_id);
    const slipRepaid = slips.reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
    const totalStlRepaid = settlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const openingBal = loan.opening_balance !== void 0 ? Number(loan.opening_balance) : Number(loan.amount || 0);
    const addBal = (loan.additional_loans || []).reduce((s, a) => s + Number(a.amount || 0), 0);
    const totalBorrowed = openingBal + addBal;
    const currentOutstanding = Math.max(0, totalBorrowed - (slipRepaid + totalStlRepaid));
    if (currentOutstanding <= 0 || settlementData.recovery_type === "FULL_SETTLEMENT") {
      loan.status = "CLOSED";
      loan.closed_date = settlementData.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      loan.closure_reference = settlementData.reference_number || `STL-FULL-${Date.now()}`;
      auditTrail.push({
        id: `AUD-${Date.now() + 1}`,
        date: (/* @__PURE__ */ new Date()).toISOString().replace("T", " ").substring(0, 16),
        action: "LOAN_CLOSED",
        details: `Loan account ${loan.loan_number || loan.id} marked CLOSED. Balance: \u20B90`,
        performed_by: settlementData.approved_by || "HR Admin"
      });
    }
    this.dbSqlite.run(
      `UPDATE loans SET settlements = ?, status = ?, closed_date = ?, closure_reference = ?, audit_trail = ? WHERE id = ?`,
      [
        JSON.stringify(loan.settlements),
        loan.status,
        loan.closed_date || "",
        loan.closure_reference || "",
        JSON.stringify(loan.audit_trail),
        loanId
      ]
    );
    this.persistData();
    return loan;
  }
  updateLoanStatus(id, status) {
    if (!this.data.loans) this.data.loans = [];
    const idx = this.data.loans.findIndex((l) => l.id === id);
    if (idx === -1) return false;
    const loan = this.data.loans[idx];
    loan.status = status;
    if (status === "CLOSED") {
      loan.closed_date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    }
    this.dbSqlite.run(`UPDATE loans SET status = ?, closed_date = ? WHERE id = ?`, [status, loan.closed_date || "", id]);
    this.persistData();
    return true;
  }
  skipLoanEmi(loanId, month, action, reason) {
    if (!this.data.loans) this.data.loans = [];
    const idx = this.data.loans.findIndex((l) => l.id === loanId);
    if (idx === -1) return null;
    const loan = this.data.loans[idx];
    let skipped = Array.isArray(loan.skipped_months) ? [...loan.skipped_months] : [];
    if (action === "SKIP") {
      if (!skipped.includes(month)) {
        skipped.push(month);
      }
    } else {
      skipped = skipped.filter((m) => m !== month);
    }
    loan.skipped_months = skipped;
    this.dbSqlite.run(`UPDATE loans SET skipped_months = ? WHERE id = ?`, [JSON.stringify(skipped), loanId]);
    const empPayslips = (this.data.payslips || []).filter((p) => p.employee_id === loan.employee_id && p.month === month);
    for (const slip of empPayslips) {
      if (action === "SKIP") {
        slip.loan_deduction = 0;
      } else {
        slip.loan_deduction = Math.min(Number(loan.monthly_deduction || 0), Number(loan.amount || 0));
      }
      slip.total_deductions = (slip.pf_deduction || 0) + (slip.esic_deduction || 0) + (slip.professional_tax || 0) + (slip.tds || 0) + (slip.loan_deduction || 0) + (slip.salary_advance || 0) + (slip.custom_deductions || 0);
      slip.net_salary = Math.max(0, slip.gross_salary - slip.total_deductions);
    }
    this.persistData();
    return loan;
  }
  addLoanAmount(loanId, amount, month, reason) {
    if (!this.data.loans) this.data.loans = [];
    const idx = this.data.loans.findIndex((l) => l.id === loanId);
    if (idx === -1) return null;
    const loan = this.data.loans[idx];
    const additional = Array.isArray(loan.additional_loans) ? [...loan.additional_loans] : [];
    additional.push({
      id: `ADD-${Date.now()}`,
      amount: Number(amount),
      month: month || "2026-04",
      reason: reason || "Additional Loan Top-up",
      date: (/* @__PURE__ */ new Date()).toISOString()
    });
    loan.additional_loans = additional;
    loan.amount = Number(loan.amount || 0) + Number(amount);
    if (loan.status === "CLOSED") {
      loan.status = "ACTIVE";
    }
    this.dbSqlite.run(
      `UPDATE loans SET amount = ?, additional_loans = ?, status = ? WHERE id = ?`,
      [loan.amount, JSON.stringify(additional), loan.status, loanId]
    );
    this.persistData();
    return loan;
  }
  updateLoanDetails(loanId, updates) {
    if (!this.data.loans) this.data.loans = [];
    const idx = this.data.loans.findIndex((l) => l.id === loanId);
    if (idx === -1) return null;
    const loan = this.data.loans[idx];
    if (updates.amount !== void 0) loan.amount = Number(updates.amount);
    if (updates.opening_balance !== void 0) loan.opening_balance = Number(updates.opening_balance);
    if (updates.monthly_deduction !== void 0) loan.monthly_deduction = Number(updates.monthly_deduction);
    if (updates.total_installments !== void 0) loan.total_installments = Number(updates.total_installments);
    if (updates.opening_date !== void 0) loan.opening_date = updates.opening_date;
    if (updates.reason !== void 0) loan.reason = updates.reason;
    loan.total_amount = loan.amount;
    this.dbSqlite.run(
      `UPDATE loans SET amount = ?, opening_balance = ?, monthly_deduction = ?, total_installments = ?, opening_date = ?, reason = ? WHERE id = ?`,
      [loan.amount, loan.opening_balance, loan.monthly_deduction, loan.total_installments, loan.opening_date, loan.reason, loanId]
    );
    this.persistData();
    return loan;
  }
  getDepartments() {
    if (!this.data.departments || this.data.departments.length === 0) {
      this.data.departments = ["Production", "QC", "Maintenance", "Stores", "Purchase", "Accounts", "HR", "Dispatch", "Sales", "Marketing", "R&D", "Administration"];
    }
    return this.data.departments;
  }
  addDepartment(dept) {
    if (!this.data.departments) {
      this.data.departments = ["Production", "QC", "Maintenance", "Stores", "Purchase", "Accounts", "HR", "Dispatch", "Sales", "Marketing", "R&D", "Administration"];
    }
    const cleanDept = dept.trim();
    if (cleanDept && !this.data.departments.includes(cleanDept)) {
      this.data.departments.push(cleanDept);
      this.dbSqlite.run(`INSERT OR IGNORE INTO departments (name) VALUES (?)`, [cleanDept]);
    }
    return this.data.departments;
  }
  // Attendance spreadsheet methods
  getAttendance(month, companyFilter) {
    let records = this.data.attendance.filter((a) => a.month === month);
    if (companyFilter && companyFilter !== "ALL") {
      records = records.filter((a) => {
        const emp = this.getEmployeeById(a.employee_id);
        return emp?.company === companyFilter;
      });
    }
    return records;
  }
  getEmployeeAttendance(employeeId) {
    return this.data.attendance.filter((a) => a.employee_id === employeeId);
  }
  getAttendanceByEmployeeAndMonth(employeeId, month) {
    return this.data.attendance.filter((a) => a.employee_id === employeeId && a.month === month);
  }
  /**
   * ===== Workforce Module (Phase B) =====
   * Reconcile a parsed CSV/biometric upload against the worker roster for one month.
   * Rules (per user approval):
   *  - Uploaded CSV is the AUTHORITATIVE attendance input for the worker month.
   *  - Staff in CSV -> skipped using Employee Master classification ONLY (never by name).
   *  - Workers not in CSV -> Present = 0, still visible (never excluded/copied/assumed).
   *  - Exceptions: unknown employee, duplicate, wrong month, wrong unit, contractor mismatch.
   *  - Existing STAFF attendance/payroll is NEVER touched.
   *  - Direct biometric remains DISABLED.
   */
  reconcileAttendanceUpload(params) {
    const { company, month, source, fileName, uploadedBy, rows } = params;
    const writeThrough = params.writeThrough !== false;
    if (source === "BIOMETRIC_DIRECT" && this._flag("direct_biometric_enabled") !== "1") {
      throw new Error("Direct biometric integration is disabled. Use CSV source (configured from next month).");
    }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error("Invalid month. Expected YYYY-MM.");
    }
    const calendarDays = new Date(parseInt(month.slice(0, 4), 10), parseInt(month.slice(5, 7), 10), 0).getDate();
    const existingAtt = this.data.attendance.filter((a) => a.month === month);
    const attByEmp = new Map(existingAtt.map((a) => [a.employee_id, a]));
    const allEmps = this.getEmployees(company);
    const roster = allEmps.filter((e) => this._isWorkerEmp(e));
    const staffSkipped = [];
    const duplicateIds = [];
    const seenIds = /* @__PURE__ */ new Set();
    const matchedIds = /* @__PURE__ */ new Set();
    const exceptions = [];
    const attendancePreview = [];
    const batchId = this._nextBatchId(company, month, source);
    for (const row of rows) {
      const workerId = (row.worker_id ?? row.worker_code ?? row.emp_code ?? row.employee_id ?? row.id ?? "").toString().trim();
      const name = (row.worker_name ?? row.name ?? row.employee_name ?? "").toString().trim();
      if (row.month != null && String(row.month).trim() !== "") {
        const rowMonthNorm = this._parseMonth(row.month);
        if (rowMonthNorm && rowMonthNorm !== month) {
          exceptions.push({ employee_id: workerId, name, reason: `Wrong month: "${rowMonthNorm}" (expected "${month}")` });
          continue;
        }
      }
      if (!workerId) {
        exceptions.push({ employee_id: "", name, reason: "Missing worker_id/emp_code in CSV row" });
        continue;
      }
      const idKey = this._norm(workerId);
      if (seenIds.has(idKey)) {
        duplicateIds.push(workerId);
        exceptions.push({ employee_id: workerId, name, reason: "Duplicate worker_id in CSV" });
        continue;
      }
      seenIds.add(idKey);
      const emp = allEmps.find((e) => e.id === workerId || e.emp_code && e.emp_code === workerId);
      if (!emp) {
        exceptions.push({ employee_id: workerId, name, reason: "Unknown employee \u2014 not found in company roster" });
        continue;
      }
      matchedIds.add(emp.id);
      if (!this._isWorkerEmp(emp)) {
        staffSkipped.push({ ...row, employee_id: emp.id, matched_name: emp.name, reason: "Staff employee excluded from worker processing" });
        continue;
      }
      const rowUnit = row.unit != null ? String(row.unit).trim() : "";
      if (rowUnit && !this._unitMatches(emp, rowUnit)) {
        exceptions.push({ employee_id: emp.id, name: emp.name, reason: `Wrong unit: "${rowUnit}" (roster unit: "${this._empUnit(emp)}")` });
        continue;
      }
      const rowContractor = row.contractor ?? row.contractor_name != null ? String(row.contractor ?? row.contractor_name).trim() : "";
      if (rowContractor && this._norm(emp.contractor) && this._norm(rowContractor) !== this._norm(emp.contractor)) {
        exceptions.push({ employee_id: emp.id, name: emp.name, reason: `Contractor mismatch: CSV "${rowContractor}", roster "${emp.contractor}"` });
        continue;
      }
      const present = this._num(row.present ?? row.present_days);
      const leave = this._num(row.leave ?? row.leave_days ?? row.paid_leave);
      const weeklyOff = this._num(row.weekly_off ?? row.week_off ?? row.weeklyoff);
      const holiday = this._num(row.holiday ?? row.paid_holiday ?? row.holiday_days);
      const lwp = this._num(row.lwp ?? row.lop);
      const absent = this._num(row.absent ?? row.absent_days);
      const otHours = this._num(row.ot_hours ?? row.overtime ?? row.overtime_hours);
      const paidDays = present + leave + weeklyOff + holiday;
      const record = {
        id: `ATT-${month}-${emp.id}`,
        employee_id: emp.id,
        month,
        total_days: calendarDays,
        working_days: paidDays,
        lop_days: absent + lwp,
        overtime_hours: otHours,
        pay_days: paidDays,
        present,
        absent,
        weekly_off: weeklyOff,
        paid_holiday: holiday,
        leave,
        lwp,
        ot_hours: otHours,
        upload_batch_id: batchId,
        upload_source: source,
        file_name: fileName || null,
        worker_id: emp.id,
        name: emp.name,
        worker_category: emp.employee_category === "Worker" || !!emp.is_company_worker ? "Company" : "Contractor",
        is_company_worker: emp.employee_category === "Worker",
        csv_found: 1
      };
      if (writeThrough) {
        const existing = attByEmp.get(emp.id);
        if (existing) {
          Object.assign(existing, record);
          this._updateAttendanceRow(existing);
        } else {
          this.data.attendance.push(record);
          this._insertAttendanceRow(record);
        }
        attByEmp.set(emp.id, record);
      }
      attendancePreview.push(record);
    }
    const missingWorkers = [];
    for (const emp of roster) {
      if (matchedIds.has(emp.id) || seenIds.has(this._norm(emp.id))) continue;
      missingWorkers.push({ employee_id: emp.id, name: emp.name });
      exceptions.push({ employee_id: emp.id, name: emp.name, reason: "Present in worker roster but NOT in uploaded CSV" });
      const zeroRec = {
        id: `ATT-${month}-${emp.id}`,
        employee_id: emp.id,
        month,
        total_days: calendarDays,
        working_days: 0,
        lop_days: 0,
        overtime_hours: 0,
        pay_days: 0,
        present: 0,
        absent: 0,
        weekly_off: 0,
        paid_holiday: 0,
        leave: 0,
        lwp: 0,
        ot_hours: 0,
        upload_batch_id: batchId,
        upload_source: source,
        file_name: fileName || null,
        worker_id: emp.id,
        name: emp.name,
        worker_category: emp.employee_category === "Worker" || !!emp.is_company_worker ? "Company" : "Contractor",
        is_company_worker: emp.employee_category === "Worker",
        csv_found: 0
      };
      if (writeThrough) {
        const existing = attByEmp.get(emp.id);
        if (existing) {
          Object.assign(existing, zeroRec);
          this._updateAttendanceRow(existing);
        } else {
          this.data.attendance.push(zeroRec);
          this._insertAttendanceRow(zeroRec);
        }
        attByEmp.set(emp.id, zeroRec);
      }
      attendancePreview.push(zeroRec);
    }
    const batch = {
      id: batchId,
      company,
      month,
      source,
      file_name: fileName || "",
      uploaded_by: uploadedBy,
      uploaded_at: (/* @__PURE__ */ new Date()).toISOString(),
      staff_skipped: staffSkipped.length,
      worker_rows: matchedIds.size,
      duplicate_ids: JSON.stringify(duplicateIds),
      status: writeThrough ? "VALIDATED" : "OK"
    };
    batch.exceptions_json = JSON.stringify(exceptions.slice(0, 500));
    this._upsertBatch(batch);
    if (writeThrough) {
      this.setMonthStatusState(company, month, "UPLOADED", uploadedBy);
      this.logAudit(
        "Workforce Attendance Upload",
        `${fileName || source} \u2192 ${company} ${month}: ${matchedIds.size} workers matched, ${staffSkipped.length} staff skipped, ${missingWorkers.length} missing (Present=0), ${exceptions.length} exceptions`,
        uploadedBy || "HR"
      );
    }
    return { batch, matched: matchedIds.size, staffSkipped, missingWorkers, duplicateIds, exceptions, attendancePreview };
  }
  /** ===== Workforce Module (Phase B: infrastructure helpers) ===== */
  _norm(s) {
    return String(s == null ? "" : s).toString().trim().toLowerCase();
  }
  _num(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }
  _parseMonth(v) {
    const s = String(v == null ? "" : v).trim();
    const re1 = s.match(/^(\d{4})[-/](\d{1,2})$/);
    if (re1) return `${re1[1]}-${String(Number(re1[2])).padStart(2, "0")}`;
    const re2 = s.match(/^([A-Za-z]{3,9})\s*[-/]?\s*(\d{4})$/);
    if (re2) {
      const M = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
      const k = re2[1].slice(0, 3).toLowerCase();
      if (M[k]) return `${re2[2]}-${M[k]}`;
    }
    return s;
  }
  _empUnit(emp) {
    return emp.company || emp.cost_center || "";
  }
  _unitMatches(emp, unit) {
    const u = this._norm(unit);
    if (!u) return true;
    const candidates = [emp.company, emp.cost_center];
    const comp = this.getCompanies().find((c) => c.id === emp.company);
    if (comp) {
      candidates.push(comp.name, comp.unit_name);
    }
    return candidates.some((c) => c && this._norm(c) === u);
  }
  /** Worker classification from Employee Master ONLY (never from name). */
  _isWorkerEmp(emp) {
    const cat = String(emp.employee_category || "").trim().toLowerCase();
    if (cat === "worker" || cat === "contract") return true;
    if ((!emp.employee_category || cat === "staff") && (emp.contractor || emp.contractor_id)) return true;
    return false;
  }
  _flag(key) {
    try {
      const arr = this.data.system_settings;
      if (Array.isArray(arr)) {
        const hit = arr.find((s) => s && s.key === key);
        if (hit && hit.value != null) return String(hit.value);
      }
    } catch {
    }
    return "";
  }
  _wfEnabled() {
    return this._flag("workforce_module_enabled") === "1";
  }
  _nextBatchId(company, month, source) {
    const ts = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const n = (this.data.attendance_upload_batches || []).length + 1;
    return `BATCH-${company}-${month}-${source}-${ts}-${n}`;
  }
  _upsertBatch(batch) {
    const arr = this.data.attendance_upload_batches || [];
    const idx = arr.findIndex((b) => b.id === batch.id);
    if (idx >= 0) arr[idx] = batch;
    else arr.push(batch);
    if (this.dbSqlite && typeof this.dbSqlite.run === "function") {
      this.dbSqlite.run(
        `INSERT OR REPLACE INTO attendance_upload_batches (id, company, month, source, file_name, uploaded_by, uploaded_at, staff_skipped, worker_rows, duplicate_ids, exceptions_json, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [batch.id, batch.company, batch.month, batch.source, batch.file_name || "", batch.uploaded_by || null, batch.uploaded_at, batch.staff_skipped || 0, batch.worker_rows || 0, batch.duplicate_ids || "[]", batch.exceptions_json || null, batch.status || "OK"]
      );
    }
  }
  _insertAttendanceRow(record) {
    if (!this.dbSqlite || typeof this.dbSqlite.run !== "function") return;
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, upload_batch_id, upload_source, file_name, pay_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.id, record.employee_id, record.month, record.total_days || 0, record.working_days || 0, record.lop_days || 0, record.ot_hours || 0, record.present ?? null, record.absent ?? null, record.weekly_off ?? null, record.paid_holiday ?? null, record.leave ?? null, record.lwp ?? null, record.ot_hours ?? null, record.upload_batch_id || null, record.upload_source || "CSV", record.file_name || null, record.pay_days ?? null]
    );
  }
  _updateAttendanceRow(record) {
    if (!this.dbSqlite || typeof this.dbSqlite.run !== "function") return;
    this.dbSqlite.run(
      `UPDATE attendance SET total_days = ?, working_days = ?, lop_days = ?, overtime_hours = ?, present = ?, absent = ?, weekly_off = ?, paid_holiday = ?, leave = ?, lwp = ?, ot_hours = ?, upload_batch_id = ?, upload_source = ?, file_name = ?, pay_days = ? WHERE id = ?`,
      [record.total_days || 0, record.working_days || 0, record.lop_days || 0, record.ot_hours || 0, record.present ?? null, record.absent ?? null, record.weekly_off ?? null, record.paid_holiday ?? null, record.leave ?? null, record.lwp ?? null, record.ot_hours ?? null, record.upload_batch_id || null, record.upload_source || "CSV", record.file_name || null, record.pay_days ?? null, record.id]
    );
  }
  /** ===== Workforce Module (Phase B: month workflow) ===== */
  ensureWorkforceSettings() {
    const defaults = [
      ["workforce_module_enabled", "0"],
      ["direct_biometric_enabled", "0"],
      ["min_wage_default", "511"],
      ["use_min_wage_ncp", "0"],
      ["pf_ncp_reduces_statutory_pf", "0"],
      ["esic_use_pf_ncp", "0"]
    ];
    const dataAny = this.data;
    if (!Array.isArray(dataAny.system_settings)) dataAny.system_settings = [];
    for (const [k, v] of defaults) {
      if (!dataAny.system_settings.find((s) => s && s.key === k)) dataAny.system_settings.push({ key: k, value: v });
    }
  }
  async getWorkforceSettings() {
    this.ensureWorkforceSettings();
    const out = {};
    for (const s of this.data.system_settings || []) if (s && s.key) out[s.key] = String(s.value);
    return out;
  }
  async setWorkforceSetting(key, value) {
    this.ensureWorkforceSettings();
    const arr = this.data.system_settings;
    const hit = arr.find((s) => s && s.key === key);
    if (hit) hit.value = value;
    else arr.push({ key, value });
    if (this.dbSqlite && typeof this.dbSqlite.run === "function") await this.setSystemSetting(key, value);
  }
  getMonthStatus(company, month) {
    return (this.data.month_status || []).find((s) => s.company === company && s.month === month);
  }
  setMonthStatusState(company, month, state, actor) {
    const arr = this.data.month_status || [];
    let s = arr.find((m) => m.company === company && m.month === month);
    if (!s) {
      s = { company, month, state, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      arr.push(s);
    } else {
      s.state = state;
      s.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      if (state === "FINALIZED" || state === "LOCKED") {
        s.locked_by = actor;
        s.locked_at = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    if (this.dbSqlite && typeof this.dbSqlite.run === "function") {
      this.dbSqlite.run(
        `INSERT OR REPLACE INTO month_status (company, month, state, locked_by, locked_at, lock_reason, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [company, month, state, s.locked_by || null, s.locked_at || null, s.lock_reason || null, s.updated_at]
      );
    }
    return s;
  }
  getWorkerBatches(company, month) {
    return (this.data.attendance_upload_batches || []).filter((b) => b.company === company && (!month || b.month === month)).sort((a, b) => String(b.uploaded_at || "").localeCompare(String(a.uploaded_at || "")));
  }
  /** Reconciliation report — Employee Master workers VS uploaded CSV workers (Rule #7). */
  getWorkerReconciliation(company, month) {
    const allEmps = this.getEmployees(company);
    const roster = allEmps.filter((e) => this._isWorkerEmp(e));
    const monthAtt = this.data.attendance.filter((a) => a.month === month);
    const attByEmp = new Map(monthAtt.map((a) => [a.employee_id, a]));
    const batches = this.getWorkerBatches(company, month);
    const latestBatch = batches[0];
    const duplicateSet = /* @__PURE__ */ new Set();
    const batchExceptions = [];
    if (latestBatch) {
      try {
        JSON.parse(latestBatch.duplicate_ids || "[]").forEach((id) => duplicateSet.add(id));
      } catch {
      }
      try {
        const ex = JSON.parse(latestBatch.exceptions_json || "[]");
        if (Array.isArray(ex)) batchExceptions.push(...ex);
      } catch {
      }
    }
    const rows = [];
    for (const emp of roster) {
      const att = attByEmp.get(emp.id);
      const isCsv = !!(att && (att.upload_source === "CSV" || att.upload_source === "BIOMETRIC_DIRECT"));
      const csvFound = isCsv ? att.csv_found ?? 1 : 0;
      const present = att?.present || 0;
      const leave = att?.leave || 0;
      const weeklyOff = att?.weekly_off || 0;
      const holiday = att?.paid_holiday || 0;
      const paidDays = att?.pay_days ?? (att?.working_days || 0);
      const exs = [];
      if (!csvFound) exs.push("NOT IN UPLOADED CSV");
      if (duplicateSet.has(emp.id)) exs.push("DUPLICATE");
      const be = batchExceptions.find((x) => x && String(x.employee_id) === emp.id);
      if (be && be.reason && be.reason !== "Present in worker roster but NOT in uploaded CSV") exs.push(be.reason);
      rows.push({
        worker_id: emp.id,
        worker_name: emp.name,
        category: emp.employee_category === "Worker" ? "Company Worker" : emp.employee_category === "Contract" ? "Contractor Worker" : "Staff",
        unit: this._empUnit(emp),
        contractor: emp.contractor || "",
        csv_found: csvFound ? "YES" : "NO",
        present,
        leave,
        weekly_off: weeklyOff,
        holiday,
        paid_days: paidDays,
        exceptions: exs
      });
    }
    const staffInCsv = [];
    for (const a of monthAtt) {
      if (a.upload_source === "CSV" || a.upload_source === "BIOMETRIC_DIRECT") {
        const emp = allEmps.find((e) => e.id === a.employee_id);
        if (emp && !this._isWorkerEmp(emp)) staffInCsv.push({ worker_id: emp.id, name: emp.name, unit: this._empUnit(emp) });
      }
    }
    const unknownEmployees = [];
    for (const x of batchExceptions) {
      if (x && (x.employee_id === "" || !allEmps.find((e) => e.id === x.employee_id) || String(x.reason || "").includes("Unknown"))) {
        unknownEmployees.push({ worker_id: x.employee_id, name: x.name, reason: x.reason });
      }
    }
    return {
      month,
      company,
      state: this.getMonthStatus(company, month)?.state || "OPEN",
      last_batch: latestBatch || null,
      summary: {
        roster_workers: roster.length,
        csv_matched: rows.filter((r) => r.csv_found === "YES").length,
        csv_missing: rows.filter((r) => r.csv_found === "NO").length,
        staff_in_csv: staffInCsv.length,
        exceptions: rows.reduce((s, r) => s + r.exceptions.length, 0) + unknownEmployees.length
      },
      rows,
      staff_in_csv: staffInCsv,
      unknown_employees: unknownEmployees
    };
  }
  /** Lock reconciled worker attendance into paid days (Rule #14 stage 1). */
  finalizeWorkerAttendance(company, month, actor) {
    if (!this._wfEnabled()) {
      throw new Error('Workforce module is disabled. Enable setting "workforce_module_enabled".');
    }
    const report = this.getWorkerReconciliation(company, month);
    for (const row of report.rows) {
      const att = this.data.attendance.find((a) => a.month === month && a.employee_id === row.worker_id);
      if (!att) continue;
      att.pay_days = row.paid_days;
      att.working_days = row.paid_days;
      att.is_locked = true;
      if (this.dbSqlite && typeof this.dbSqlite.run === "function") {
        this.dbSqlite.run(`UPDATE attendance SET pay_days = ?, working_days = ?, is_locked = 1 WHERE id = ?`, [row.paid_days, row.paid_days, att.id]);
      }
    }
    this.setMonthStatusState(company, month, "FINALIZED", actor);
    this.logAudit("Workforce Finalized", `Worker attendance finalized for ${company} ${month}`, actor || "HR");
    return {
      month,
      company,
      state: "FINALIZED",
      finalized_at: (/* @__PURE__ */ new Date()).toISOString(),
      roster_workers: report.rows.length,
      with_attendance: report.rows.filter((r) => r.paid_days > 0).length,
      zero_attendance: report.rows.filter((r) => r.paid_days === 0).length,
      total_paid_days: report.rows.reduce((s, r) => s + r.paid_days, 0)
    };
  }
  /** Worker Payroll generation: paid days → wages → contractor bills → company payroll → HDFC/Cheque → PF/ESIC challan. */
  async generateWorkerPayroll(company, month, actor) {
    if (!this._wfEnabled()) {
      throw new Error('Workforce module is disabled. Enable setting "workforce_module_enabled".');
    }
    const allEmps = this.getEmployees(company);
    const roster = allEmps.filter((e) => this._isWorkerEmp(e));
    const monthAtt = this.data.attendance.filter((a) => a.month === month);
    const attByEmp = new Map(monthAtt.map((a) => [a.employee_id, a]));
    const lines = [];
    const totals = { gross: 0, pf: 0, esic: 0, net: 0, paidDays: 0 };
    for (const emp of roster) {
      const att = attByEmp.get(emp.id);
      if (!att) continue;
      const paidDays = att.pay_days ?? (att.present || 0) + (att.leave || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0);
      const wageRate = emp.wage_rate || emp.base_salary || 0;
      const gross = Math.round(paidDays * wageRate * 100) / 100;
      const pfEmp = emp.pf_opt_in ? Math.round(gross * 0.12 * 100) / 100 : 0;
      const pfEmployer = emp.pf_opt_in ? Math.round(gross * 0.12 * 100) / 100 : 0;
      const esicEmp = emp.esic_opt_in ? Math.round(gross * 75e-4 * 100) / 100 : 0;
      const esicEmployer = emp.esic_opt_in ? Math.round(gross * 0.0325 * 100) / 100 : 0;
      const net = Math.round((gross - pfEmp - esicEmp) * 100) / 100;
      totals.gross += gross;
      totals.pf += pfEmp + pfEmployer;
      totals.esic += esicEmp + esicEmployer;
      totals.net += net;
      totals.paidDays += paidDays;
      lines.push({
        worker_id: emp.id,
        name: emp.name,
        category: emp.employee_category === "Contract" ? "Contractor" : emp.employee_category === "Worker" || !!emp.is_company_worker ? "Company" : "Worker",
        unit: this._empUnit(emp),
        contractor: emp.employee_category === "Contract" ? emp.contractor || "" : "",
        paid_days: paidDays,
        wage_rate: wageRate,
        gross_wages: gross,
        pf_employee: pfEmp,
        pf_employer: pfEmployer,
        esic_employee: esicEmp,
        esic_employer: esicEmployer,
        net_pay: net,
        payment_mode: emp.payment_mode || "HDFC",
        bank_name: emp.bank_name || "",
        bank_account: emp.bank_account || "",
        ifsc: emp.ifsc || "",
        pf_enabled: !!emp.pf_opt_in,
        esic_enabled: !!emp.esic_opt_in
      });
    }
    const contractorGroups = /* @__PURE__ */ new Map();
    for (const l of lines.filter((x) => x.category === "Contractor" && x.contractor)) {
      if (!contractorGroups.has(l.contractor)) contractorGroups.set(l.contractor, []);
      contractorGroups.get(l.contractor).push(l);
    }
    const contractorBills = [];
    const contractorBillLines = [];
    for (const [ctr, lns] of contractorGroups) {
      const billId = `BILL-${company}-${month}-${ctr.replace(/[^A-Za-z0-9]+/g, "-")}`;
      const g = lns.reduce((s, x) => s + x.gross_wages, 0);
      const pf = lns.reduce((s, x) => s + x.pf_employee + x.pf_employer, 0);
      const esic = lns.reduce((s, x) => s + x.esic_employee + x.esic_employer, 0);
      const empShare = lns.reduce((s, x) => s + x.pf_employer + x.esic_employer, 0);
      contractorBills.push({
        id: billId,
        company,
        contractor_id: ctr,
        month,
        status: "DRAFT",
        total_gross: Math.round(g * 100) / 100,
        total_pf: Math.round(pf * 100) / 100,
        total_esic: Math.round(esic * 100) / 100,
        net_payable: Math.round((g + empShare) * 100) / 100,
        created_by: actor,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        locked: 0
      });
      for (const l of lns) {
        contractorBillLines.push({
          id: `LIN-${billId}-${l.worker_id}`,
          bill_id: billId,
          employee_id: l.worker_id,
          worker_name: l.name,
          present_days: l.paid_days,
          leave_days: 0,
          weekly_off: 0,
          holiday: 0,
          paid_days: l.paid_days,
          ncp_days: 0,
          wage_rate: l.wage_rate,
          gross_wages: l.gross_wages,
          pf: l.pf_employee + l.pf_employer,
          esic: l.esic_employee + l.esic_employer,
          other_deductions: 0,
          net_payable: Math.round((l.gross_wages + l.pf_employer + l.esic_employer) * 100) / 100
        });
      }
    }
    this.data.contractor_bills = [...(this.data.contractor_bills || []).filter((b) => !(b.company === company && b.month === month)), ...contractorBills];
    this.data.contractor_bill_lines = [...(this.data.contractor_bill_lines || []).filter((l) => !(l.bill_id && contractorBillLines.some((nl) => nl.id === l.id))), ...contractorBillLines];
    if (this.dbSqlite && typeof this.dbSqlite.run === "function") {
      for (const b of contractorBills) {
        this.dbSqlite.run(`INSERT OR REPLACE INTO contractor_bills (id, company, contractor_id, month, status, total_gross, total_pf, total_esic, net_payable, created_by, created_at, locked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [b.id, b.company, b.contractor_id, b.month, b.status, b.total_gross, b.total_pf, b.total_esic, b.net_payable, b.created_by || null, b.created_at || null, b.locked || 0]);
      }
      for (const l of contractorBillLines) {
        this.dbSqlite.run(`INSERT OR REPLACE INTO contractor_bill_lines (id, bill_id, employee_id, worker_name, present_days, leave_days, weekly_off, holiday, paid_days, ncp_days, wage_rate, gross_wages, pf, esic, other_deductions, net_payable) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [l.id, l.bill_id, l.employee_id, l.worker_name || null, l.present_days, l.leave_days, l.weekly_off, l.holiday, l.paid_days, l.ncp_days, l.wage_rate, l.gross_wages, l.pf, l.esic, l.other_deductions, l.net_payable]);
      }
    }
    const companyLines = lines.filter((x) => x.category !== "Contractor");
    const cpRows = companyLines.map((l) => ({
      id: `CW-${company}-${month}-${l.worker_id}`,
      company,
      month,
      worker_id: l.worker_id,
      name: l.name,
      category: l.category,
      unit: l.unit,
      contractor: l.contractor || "",
      paid_days: l.paid_days,
      wage_rate: l.wage_rate,
      gross_wages: l.gross_wages,
      pf_employee: l.pf_employee,
      pf_employer: l.pf_employer,
      esic_employee: l.esic_employee,
      esic_employer: l.esic_employer,
      net_pay: l.net_pay,
      payment_mode: l.payment_mode,
      bank_name: l.bank_name,
      bank_account: l.bank_account,
      ifsc: l.ifsc,
      generated_at: (/* @__PURE__ */ new Date()).toISOString()
    }));
    this.data.company_worker_payroll = [...(this.data.company_worker_payroll || []).filter((p) => !(p.company === company && p.month === month)), ...cpRows];
    if (this.dbSqlite && typeof this.dbSqlite.run === "function") {
      for (const c of cpRows) {
        this.dbSqlite.run(`INSERT OR REPLACE INTO company_worker_payroll (id, company, month, worker_id, name, category, unit, contractor, paid_days, wage_rate, gross_wages, pf_employee, pf_employer, esic_employee, esic_employer, net_pay, payment_mode, bank_name, bank_account, ifsc, generated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [c.id, c.company, c.month, c.worker_id, c.name, c.category, c.unit, c.contractor, c.paid_days, c.wage_rate, c.gross_wages, c.pf_employee, c.pf_employer, c.esic_employee, c.esic_employer, c.net_pay, c.payment_mode, c.bank_name, c.bank_account, c.ifsc, c.generated_at]);
      }
    }
    const hdfcSheet = cpRows.filter((x) => String(x.payment_mode).toUpperCase() === "HDFC").map((x) => ({ emp_code: x.worker_id, name: x.name, unit: x.unit, bank_name: x.bank_name, bank_account: x.bank_account, ifsc: x.ifsc, amount: x.net_pay }));
    const chequeLines = cpRows.filter((x) => String(x.payment_mode).toUpperCase() !== "HDFC").map((x) => ({ ...x, company, month }));
    for (const b of contractorBills) {
      chequeLines.push({
        worker_id: b.contractor_id,
        name: b.contractor_id,
        category: "Contractor",
        company,
        month,
        paid_days: 0,
        gross_wages: b.net_payable,
        pf_employee: 0,
        pf_employer: 0,
        esic_employee: 0,
        esic_employer: 0,
        net_pay: b.net_payable,
        payment_mode: "CHEQUE",
        bank_name: "",
        bank_account: "",
        ifsc: ""
      });
    }
    for (const c of chequeLines) {
      const cid = `CHEQUE-${company}-${month}-${c.worker_id}`;
      this.data.cheque_payments = (this.data.cheque_payments || []).filter((ch) => !(ch.employee_id === c.worker_id && ch.company === company && ch.month === month));
      const cp = { id: cid, employee_id: c.worker_id, company, month, net_pay: c.net_pay, cheque_number: "", payment_date: "" };
      this.data.cheque_payments.push(cp);
      if (this.dbSqlite && typeof this.dbSqlite.run === "function") {
        this.dbSqlite.run(`INSERT OR REPLACE INTO cheque_payments (id, employee_id, company, month, net_pay, cheque_number, payment_date, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [cid, c.worker_id, company, month, c.net_pay, "", "", null]);
      }
    }
    const pfEsicChallan = [];
    for (const l of lines) {
      const minWage = await this.getMinimumWage(company, { unit: l.unit, workerCategory: l.category === "Company" ? "Worker" : "Contract" });
      const ncp = this.calculateBusinessNCP(l.paid_days, l.gross_wages, minWage);
      const applicableWages = Math.round(ncp.applicableDays * l.wage_rate * 100) / 100;
      pfEsicChallan.push({
        worker_id: l.worker_id,
        name: l.name,
        category: l.category,
        paid_days: l.paid_days,
        gross_wages: l.gross_wages,
        minimum_wage: minWage,
        counted_wage_days: ncp.countedWageDays,
        applicable_days: ncp.applicableDays,
        business_ncp: ncp.businessNcp,
        applicable_wages: applicableWages,
        pf_enabled: l.pf_enabled,
        esic_enabled: l.esic_enabled,
        pf_on_applicable: l.pf_enabled ? Math.round(applicableWages * 0.12 * 100) / 100 : 0,
        esic_on_applicable: l.esic_enabled ? Math.round(applicableWages * 75e-4 * 100) / 100 : 0
      });
    }
    this.setMonthStatusState(company, month, "PAYROLL_DONE", actor);
    this.logAudit("Workforce Payroll Generated", `Worker payroll for ${company} ${month}: ${lines.length} workers, gross \u20B9${totals.gross.toFixed(2)}, net \u20B9${totals.net.toFixed(2)}`, actor || "HR");
    return {
      month,
      company,
      state: "PAYROLL_DONE",
      summary: {
        workers: lines.length,
        paid_days: Math.round(totals.paidDays * 100) / 100,
        gross_wages: Math.round(totals.gross * 100) / 100,
        net_pay: Math.round(totals.net * 100) / 100,
        contractor_bills: contractorBills.length,
        company_workers: cpRows.length,
        hdfc_rows: hdfcSheet.length,
        cheque_rows: chequeLines.length
      },
      payroll: lines,
      contractor_bills: contractorBills,
      contractor_bill_lines: contractorBillLines,
      company_worker_payroll: cpRows,
      hdfc_payment_sheet: hdfcSheet,
      cheque_payment_sheet: chequeLines,
      pf_esic_challan: pfEsicChallan
    };
  }
  upsertAttendance(att) {
    const idx = this.data.attendance.findIndex((a) => a.id === att.id);
    if (idx >= 0) {
      this.data.attendance[idx] = att;
    } else {
      this.data.attendance.push(att);
    }
    if (this.supabaseAdmin) {
      this.supabaseAdmin.from("vetan_erp_store").upsert({
        id: "live",
        payload: JSON.stringify(this.data),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  saveAttendance(bulk) {
    for (const record of bulk) {
      if (record.present !== void 0) {
        const pres = record.present || 0;
        const abs = record.absent || 0;
        const woff = record.weekly_off || 0;
        const phol = record.paid_holiday || 0;
        const lve = record.leave || 0;
        const lw = record.lwp || 0;
        if (!record.total_days || record.total_days <= 0) {
          const calendarDays = new Date(parseInt(record.month.split("-")[0]), parseInt(record.month.split("-")[1]), 0).getDate();
          record.total_days = calendarDays;
        }
        record.lop_days = abs + lw;
        record.working_days = pres + woff + phol + lve;
        record.overtime_hours = record.ot_hours || 0;
      }
      const idx = this.data.attendance.findIndex((a) => a.employee_id === record.employee_id && a.month === record.month);
      if (idx !== -1) {
        this.data.attendance[idx] = { ...this.data.attendance[idx], ...record };
      } else {
        record.id = `ATT-${record.employee_id}-${record.month}`;
        this.data.attendance.push(record);
      }
      this.dbSqlite.run(
        `INSERT OR REPLACE INTO attendance (
          id, employee_id, month, total_days, working_days, lop_days, overtime_hours,
          present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked,
          in_time, out_time, leave_pl, leave_cl, leave_sl, compoff_used
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.employee_id,
          record.month,
          record.total_days || 0,
          record.working_days || 0,
          record.lop_days || 0,
          record.overtime_hours || 0,
          record.present !== void 0 ? record.present : null,
          record.absent !== void 0 ? record.absent : null,
          record.weekly_off !== void 0 ? record.weekly_off : null,
          record.paid_holiday !== void 0 ? record.paid_holiday : null,
          record.leave !== void 0 ? record.leave : null,
          record.lwp !== void 0 ? record.lwp : null,
          record.ot_hours !== void 0 ? record.ot_hours : null,
          record.is_locked ? 1 : 0,
          record.in_time || null,
          record.out_time || null,
          record.leave_pl ?? null,
          record.leave_cl ?? null,
          record.leave_sl ?? null,
          record.compoff_used ?? null
        ]
      );
    }
    this.persistData();
  }
  resolveReportingHodForEmployee(employeeId) {
    const emp = this.getEmployeeById(employeeId);
    if (!emp) return null;
    if (emp.reporting_hod) {
      return { id: emp.reporting_hod, name: emp.reporting_hod_name || "HOD" };
    }
    const foundHod = this.data.hods?.find((h) => h.department === emp.department && h.company === emp.company && h.active);
    if (foundHod) {
      return { id: foundHod.id, name: foundHod.name };
    }
    const fallbackEmpHod = this.data.employees?.find((e) => e.department === emp.department && e.company === emp.company && e.is_hod && e.id !== emp.id);
    if (fallbackEmpHod) {
      return { id: fallbackEmpHod.id, name: fallbackEmpHod.name };
    }
    const defaultCompanyHod = this.data.hods?.find((h) => h.company === emp.company && h.active) || this.data.employees?.find((e) => e.company === emp.company && e.is_hod && e.id !== emp.id);
    if (defaultCompanyHod) {
      return { id: defaultCompanyHod.id, name: defaultCompanyHod.name };
    }
    return null;
  }
  // Leave Management operations
  getLeaveApplications(companyFilter) {
    let apps = this.data.leave_applications || [];
    if (companyFilter && companyFilter !== "ALL") {
      apps = apps.filter((a) => a.company === companyFilter);
    }
    return apps;
  }
  addLeaveApplication(app) {
    const nextNum = Math.max(...(this.data.leave_applications || []).map((a) => parseInt(a.id.replace("LV", "")) || 0), 0) + 1;
    app.id = `LV${String(nextNum).padStart(3, "0")}`;
    const hod = this.resolveReportingHodForEmployee(app.employee_id);
    if (hod) {
      app.reporting_hod = hod.id;
      app.reporting_hod_name = hod.name;
      app.status = "PENDING_HOD";
    } else {
      app.status = "PENDING_HR";
    }
    app.applied_date = (/* @__PURE__ */ new Date()).toISOString();
    if (!this.data.leave_applications) this.data.leave_applications = [];
    this.data.leave_applications.push(app);
    this.persistData();
    this.dbSqlite.run(
      `INSERT INTO leave_applications (id, employee_id, employee_name, company, leave_type, start_date, end_date, days, reason, status, applied_date, reporting_hod, reporting_hod_name, escalated_reminder_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [app.id, app.employee_id, app.employee_name, app.company, app.leave_type, app.start_date, app.end_date, app.days, app.reason, app.status, app.applied_date, app.reporting_hod || null, app.reporting_hod_name || null]
    );
    return app;
  }
  updateLeaveStatus(id, status) {
    const app = this.data.leave_applications?.find((a) => a.id === id);
    if (!app) return false;
    app.status = status;
    if (status === "APPROVED") {
      const emp = this.getEmployeeById(app.employee_id);
      if (emp) {
        const leaveKey = `leave_balance_${app.leave_type.toLowerCase()}`;
        emp[leaveKey] = Math.max(0, (emp[leaveKey] || 0) - app.days);
        this.syncEmployee(emp);
      }
    }
    this.dbSqlite.run(`UPDATE leave_applications SET status = ? WHERE id = ?`, [status, id]);
    this.persistData();
    return true;
  }
  autoUpdateAttendanceForLeave(employeeId, leaveDays, startDate, endDate, leaveType) {
    if (!employeeId || !startDate) return;
    const emp = this.getEmployeeById(employeeId);
    if (!emp) return;
    const startDateObj = new Date(startDate);
    const month = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth() + 1).padStart(2, "0")}`;
    let att = this.data.attendance.find((a) => a.employee_id === employeeId && a.month === month);
    if (!att) {
      att = {
        id: `ATT-${employeeId}-${month}`,
        employee_id: employeeId,
        month,
        total_days: 30,
        present: 0,
        absent: 0,
        weekly_off: 0,
        paid_holiday: 0,
        leave: 0,
        lwp: 0,
        working_days: 0,
        lop_days: 0,
        overtime_hours: 0
      };
      this.data.attendance.push(att);
    }
    att.leave = (att.leave || 0) + leaveDays;
    if (!att.leave_pl) att.leave_pl = 0;
    if (!att.leave_cl) att.leave_cl = 0;
    if (!att.leave_sl) att.leave_sl = 0;
    if (!att.leave_coff) att.leave_coff = 0;
    if (leaveType) {
      const lt = leaveType.toLowerCase();
      if (lt === "pl") att.leave_pl = (att.leave_pl || 0) + leaveDays;
      else if (lt === "cl") att.leave_cl = (att.leave_cl || 0) + leaveDays;
      else if (lt === "sl") att.leave_sl = (att.leave_sl || 0) + leaveDays;
      else if (lt === "coff" || lt === "c-off" || lt === "compoff") att.leave_coff = (att.leave_coff || 0) + leaveDays;
    }
    att.working_days = (att.present || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + att.leave;
    att.lop_days = (att.absent || 0) + (att.lwp || 0);
    att.total_days = (att.present || 0) + (att.absent || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + att.leave + (att.lwp || 0);
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked, leave_pl, leave_cl, leave_sl, leave_coff, pay_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [att.id, att.employee_id, att.month, att.total_days, att.working_days, att.lop_days, att.overtime_hours || 0, att.present || 0, att.absent || 0, att.weekly_off || 0, att.paid_holiday || 0, att.leave || 0, att.lwp || 0, att.overtime_hours || 0, att.is_locked ? 1 : 0, att.leave_pl || 0, att.leave_cl || 0, att.leave_sl || 0, att.leave_coff || 0, att.pay_days || null]
    );
  }
  autoUpdateAttendanceForMissPunch(employeeId, date, requestedStatus) {
    if (!employeeId || !date) return;
    const emp = this.getEmployeeById(employeeId);
    if (!emp) return;
    const dateObj = new Date(date);
    const month = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
    let att = this.data.attendance.find((a) => a.employee_id === employeeId && a.month === month);
    if (!att) {
      att = {
        id: `ATT-${employeeId}-${month}`,
        employee_id: employeeId,
        month,
        total_days: 30,
        present: 0,
        absent: 0,
        weekly_off: 0,
        paid_holiday: 0,
        leave: 0,
        lwp: 0,
        working_days: 0,
        lop_days: 0,
        overtime_hours: 0
      };
      this.data.attendance.push(att);
    }
    if (requestedStatus === "PRESENT") {
      att.present = (att.present || 0) + 1;
      att.absent = Math.max(0, (att.absent || 0) - 1);
    } else if (requestedStatus === "WEEKLY_OFF") {
      att.weekly_off = (att.weekly_off || 0) + 1;
      att.absent = Math.max(0, (att.absent || 0) - 1);
    } else if (requestedStatus === "LEAVE") {
      att.leave = (att.leave || 0) + 1;
      att.absent = Math.max(0, (att.absent || 0) - 1);
    }
    att.working_days = (att.present || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + (att.leave || 0);
    att.lop_days = (att.absent || 0) + (att.lwp || 0);
    att.total_days = (att.present || 0) + (att.absent || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + (att.leave || 0) + (att.lwp || 0);
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [att.id, att.employee_id, att.month, att.total_days, att.working_days, att.lop_days, att.overtime_hours || 0, att.present || 0, att.absent || 0, att.weekly_off || 0, att.paid_holiday || 0, att.leave || 0, att.lwp || 0, att.overtime_hours || 0, att.is_locked ? 1 : 0]
    );
  }
  updateLeaveWorkflowStatus(id, actorRole, action, actorId, override) {
    const app = this.data.leave_applications?.find((a) => a.id === id);
    if (!app) return false;
    const isSuper = actorRole === "SUPER_HR" || override;
    const isHR = actorRole === "COMPANY_HR" || isSuper;
    if (app.status === "PENDING_HOD") {
      if (actorRole === "HOD" || isSuper) {
        if (action === "APPROVE") {
          app.status = "PENDING_HR";
          app.hod_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          app.hod_id = actorId || "HOD";
        } else {
          app.status = "REJECTED_HOD";
          app.hod_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          app.hod_id = actorId || "HOD";
        }
      }
    } else if (app.status === "PENDING_HR") {
      if (isHR) {
        if (action === "APPROVE") {
          app.status = "APPROVED";
          app.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          app.hr_id = actorId || "HR";
          const emp = this.getEmployeeById(app.employee_id);
          if (emp) {
            const leaveKey = `leave_balance_${app.leave_type.toLowerCase()}`;
            emp[leaveKey] = Math.max(0, (emp[leaveKey] || 0) - app.days);
            this.syncEmployee(emp);
          }
          this.autoUpdateAttendanceForLeave(app.employee_id, app.days, app.start_date, app.end_date, app.leave_type);
        } else {
          app.status = "REJECTED_HR";
          app.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          app.hr_id = actorId || "HR";
        }
      }
    } else if (isSuper) {
      if (action === "APPROVE") {
        app.status = "APPROVED";
        app.hod_approved_date = app.hod_approved_date || (/* @__PURE__ */ new Date()).toISOString();
        app.hod_id = app.hod_id || actorId || "SuperAdmin";
        app.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
        app.hr_id = actorId || "SuperAdmin";
        const emp = this.getEmployeeById(app.employee_id);
        if (emp) {
          const leaveKey = `leave_balance_${app.leave_type.toLowerCase()}`;
          emp[leaveKey] = Math.max(0, (emp[leaveKey] || 0) - app.days);
          this.syncEmployee(emp);
        }
        this.autoUpdateAttendanceForLeave(app.employee_id, app.days, app.start_date, app.end_date, app.leave_type);
      } else {
        app.status = "REJECTED";
        app.hod_approved_date = app.hod_approved_date || (/* @__PURE__ */ new Date()).toISOString();
        app.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    this.dbSqlite.run(
      `UPDATE leave_applications SET status = ?, hod_approved_date = ?, hr_approved_date = ?, hod_id = ?, hr_id = ? WHERE id = ?`,
      [app.status, app.hod_approved_date || null, app.hr_approved_date || null, app.hod_id || null, app.hr_id || null, id]
    );
    this.persistData();
    return true;
  }
  // Attendance Correction operations
  getAttendanceCorrections() {
    if (!this.data.attendance_corrections) this.data.attendance_corrections = [];
    return this.data.attendance_corrections;
  }
  addAttendanceCorrection(req) {
    const nextNum = Math.max(...(this.data.attendance_corrections || []).map((a) => parseInt(a.id.replace("AC", "")) || 0), 0) + 1;
    req.id = `AC${String(nextNum).padStart(3, "0")}`;
    const hod = this.resolveReportingHodForEmployee(req.employee_id);
    if (hod) {
      req.reporting_hod = hod.id;
      req.reporting_hod_name = hod.name;
      req.status = "PENDING_HOD";
    } else {
      req.status = "PENDING_HR";
    }
    req.applied_date = (/* @__PURE__ */ new Date()).toISOString();
    if (!this.data.attendance_corrections) this.data.attendance_corrections = [];
    this.data.attendance_corrections.push(req);
    this.dbSqlite.run(
      `INSERT INTO attendance_corrections (id, employee_id, employee_name, company, date, original_status, requested_status, reason, applied_date, reporting_hod, reporting_hod_name, status, escalated_reminder_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [req.id, req.employee_id, req.employee_name, req.company, req.date, req.original_status, req.requested_status, req.reason, req.applied_date, req.reporting_hod || null, req.reporting_hod_name || null, req.status]
    );
    return req;
  }
  updateAttendanceCorrectionWorkflowStatus(id, actorRole, action, actorId, override) {
    if (!this.data.attendance_corrections) this.data.attendance_corrections = [];
    const req = this.data.attendance_corrections.find((a) => a.id === id);
    if (!req) return false;
    const isSuper = actorRole === "SUPER_HR" || override;
    const isHR = actorRole === "COMPANY_HR" || isSuper;
    if (req.status === "PENDING_HOD") {
      if (actorRole === "HOD" || isSuper) {
        if (action === "APPROVE") {
          req.status = "PENDING_HR";
          req.hod_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hod_id = actorId || "HOD";
        } else {
          req.status = "REJECTED_HOD";
          req.hod_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hod_id = actorId || "HOD";
        }
      }
    } else if (req.status === "PENDING_HR") {
      if (isHR) {
        if (action === "APPROVE") {
          req.status = "APPROVED";
          req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hr_id = actorId || "HR";
          this.autoUpdateAttendanceForMissPunch(req.employee_id, req.date, req.requested_status);
        } else {
          req.status = "REJECTED_HR";
          req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hr_id = actorId || "HR";
        }
      }
    } else if (isSuper) {
      if (action === "APPROVE") {
        req.status = "APPROVED";
        req.hod_approved_date = req.hod_approved_date || (/* @__PURE__ */ new Date()).toISOString();
        req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
        this.autoUpdateAttendanceForMissPunch(req.employee_id, req.date, req.requested_status);
      } else {
        req.status = "REJECTED_HR";
        req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    this.dbSqlite.run(
      `UPDATE attendance_corrections SET status = ?, hod_approved_date = ?, hr_approved_date = ?, hod_id = ?, hr_id = ? WHERE id = ?`,
      [req.status, req.hod_approved_date || null, req.hr_approved_date || null, req.hod_id || null, req.hr_id || null, id]
    );
    this.persistData();
    return true;
  }
  // Comp-off operations
  getCompOffRequests() {
    if (!this.data.compoff_requests) this.data.compoff_requests = [];
    return this.data.compoff_requests;
  }
  addCompOffRequest(req) {
    const nextNum = Math.max(...(this.data.compoff_requests || []).map((a) => parseInt(a.id.replace("CO", "")) || 0), 0) + 1;
    req.id = `CO${String(nextNum).padStart(3, "0")}`;
    const hod = this.resolveReportingHodForEmployee(req.employee_id);
    if (hod) {
      req.reporting_hod = hod.id;
      req.reporting_hod_name = hod.name;
      req.status = "PENDING_HOD";
    } else {
      req.status = "PENDING_HR";
    }
    req.applied_date = (/* @__PURE__ */ new Date()).toISOString();
    if (!this.data.compoff_requests) this.data.compoff_requests = [];
    this.data.compoff_requests.push(req);
    this.dbSqlite.run(
      `INSERT INTO compoff_requests (id, employee_id, employee_name, company, date, reason, applied_date, reporting_hod, reporting_hod_name, status, escalated_reminder_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [req.id, req.employee_id, req.employee_name, req.company, req.date, req.reason, req.applied_date, req.reporting_hod || null, req.reporting_hod_name || null, req.status]
    );
    return req;
  }
  updateCompOffWorkflowStatus(id, actorRole, action, actorId, override) {
    if (!this.data.compoff_requests) this.data.compoff_requests = [];
    const req = this.data.compoff_requests.find((a) => a.id === id);
    if (!req) return false;
    const isSuper = actorRole === "SUPER_HR" || override;
    const isHR = actorRole === "COMPANY_HR" || isSuper;
    if (req.status === "PENDING_HOD") {
      if (actorRole === "HOD" || isSuper) {
        if (action === "APPROVE") {
          req.status = "PENDING_HR";
          req.hod_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hod_id = actorId || "HOD";
        } else {
          req.status = "REJECTED_HOD";
          req.hod_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hod_id = actorId || "HOD";
        }
      }
    } else if (req.status === "PENDING_HR") {
      if (isHR) {
        if (action === "APPROVE") {
          req.status = "APPROVED";
          req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hr_id = actorId || "HR";
        } else {
          req.status = "REJECTED_HR";
          req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hr_id = actorId || "HR";
        }
      }
    } else if (isSuper) {
      if (action === "APPROVE") {
        req.status = "APPROVED";
        req.hod_approved_date = req.hod_approved_date || (/* @__PURE__ */ new Date()).toISOString();
        req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
      } else {
        req.status = "REJECTED_HR";
        req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    this.dbSqlite.run(
      `UPDATE compoff_requests SET status = ?, hod_approved_date = ?, hr_approved_date = ?, hod_id = ?, hr_id = ? WHERE id = ?`,
      [req.status, req.hod_approved_date || null, req.hr_approved_date || null, req.hod_id || null, req.hr_id || null, id]
    );
    return true;
  }
  // Overtime operations
  getOvertimeRequests() {
    if (!this.data.overtime_requests) this.data.overtime_requests = [];
    return this.data.overtime_requests;
  }
  addOvertimeRequest(req) {
    const nextNum = Math.max(...(this.data.overtime_requests || []).map((a) => parseInt(a.id.replace("OT", "")) || 0), 0) + 1;
    req.id = `OT${String(nextNum).padStart(3, "0")}`;
    const hod = this.resolveReportingHodForEmployee(req.employee_id);
    if (hod) {
      req.reporting_hod = hod.id;
      req.reporting_hod_name = hod.name;
      req.status = "PENDING_HOD";
    } else {
      req.status = "PENDING_HR";
    }
    req.applied_date = (/* @__PURE__ */ new Date()).toISOString();
    if (!this.data.overtime_requests) this.data.overtime_requests = [];
    this.data.overtime_requests.push(req);
    this.dbSqlite.run(
      `INSERT INTO overtime_requests (id, employee_id, employee_name, company, date, hours, reason, applied_date, reporting_hod, reporting_hod_name, status, escalated_reminder_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [req.id, req.employee_id, req.employee_name, req.company, req.date, req.hours, req.reason, req.applied_date, req.reporting_hod || null, req.reporting_hod_name || null, req.status]
    );
    return req;
  }
  updateOvertimeWorkflowStatus(id, actorRole, action, actorId, override) {
    if (!this.data.overtime_requests) this.data.overtime_requests = [];
    const req = this.data.overtime_requests.find((a) => a.id === id);
    if (!req) return false;
    const isSuper = actorRole === "SUPER_HR" || override;
    const isHR = actorRole === "COMPANY_HR" || isSuper;
    if (req.status === "PENDING_HOD") {
      if (actorRole === "HOD" || isSuper) {
        if (action === "APPROVE") {
          req.status = "PENDING_HR";
          req.hod_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hod_id = actorId || "HOD";
        } else {
          req.status = "REJECTED_HOD";
          req.hod_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hod_id = actorId || "HOD";
        }
      }
    } else if (req.status === "PENDING_HR") {
      if (isHR) {
        if (action === "APPROVE") {
          req.status = "APPROVED";
          req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hr_id = actorId || "HR";
          const emp = this.getEmployeeById(req.employee_id);
          if (emp) {
            const reqMonth = req.date.substring(0, 7);
            let att = this.data.attendance.find((a) => a.employee_id === emp.id && a.month === reqMonth);
            if (!att) {
              att = {
                id: `ATT-${emp.id}-${reqMonth}`,
                employee_id: emp.id,
                month: reqMonth,
                total_days: 30,
                working_days: 30,
                lop_days: 0,
                overtime_hours: 0
              };
              this.data.attendance.push(att);
            }
            att.overtime_hours += Number(req.hours);
            this.dbSqlite.run(
              `INSERT OR REPLACE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [att.id, att.employee_id, att.month, att.total_days, att.working_days, att.lop_days, att.overtime_hours]
            );
          }
        } else {
          req.status = "REJECTED_HR";
          req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
          req.hr_id = actorId || "HR";
        }
      }
    } else if (isSuper) {
      if (action === "APPROVE") {
        req.status = "APPROVED";
        req.hod_approved_date = req.hod_approved_date || (/* @__PURE__ */ new Date()).toISOString();
        req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
      } else {
        req.status = "REJECTED_HR";
        req.hr_approved_date = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    this.dbSqlite.run(
      `UPDATE overtime_requests SET status = ?, hod_approved_date = ?, hr_approved_date = ?, hod_id = ?, hr_id = ? WHERE id = ?`,
      [req.status, req.hod_approved_date || null, req.hr_approved_date || null, req.hod_id || null, req.hr_id || null, id]
    );
    return true;
  }
  // Full and Final settlement (F&F)
  getFFSettlements(companyFilter) {
    let ff = this.data.ff_settlements || [];
    if (companyFilter && companyFilter !== "ALL") {
      ff = ff.filter((f) => f.company === companyFilter);
    }
    return ff;
  }
  calculateFFSettlement(employeeId, lastDay) {
    const emp = this.getEmployeeById(employeeId);
    if (!emp) throw new Error("Employee not found for Full & Final processing");
    const joinDate = new Date(emp.joining_date);
    const exitDate = new Date(lastDay);
    const diffMs = exitDate.getTime() - joinDate.getTime();
    const serviceYears = Math.max(0, Number((diffMs / (1e3 * 60 * 60 * 24 * 365.25)).toFixed(2)));
    let gratuity_earned = 0;
    if (serviceYears >= 5) {
      gratuity_earned = Math.round(emp.base_salary / 26 * 15 * Math.floor(serviceYears));
    }
    const active_pl = emp.leave_balance_pl || 0;
    const active_cl = emp.leave_balance_cl || 0;
    const active_sl = emp.leave_balance_sl || 0;
    const earned_leave_encashment = Math.round(emp.base_salary / 30 * active_pl);
    const unpaid_salary_days = 0;
    const fullMonthlyGross = emp.base_salary + emp.hra + emp.special_allowance + (emp.conveyance_allowance || 0) + (emp.edu_allowance || 0) + (emp.medical_allowance || 0);
    const unpaid_salary_earned = Math.round(fullMonthlyGross / 30 * unpaid_salary_days);
    const notice_applicable_days = 30;
    const notice_served_days = 30;
    const notice_shortfall_days = 0;
    const notice_period_deduction = 0;
    const recovery_salary_advance = 0;
    const empLoans = (this.data.loans || []).filter((l) => l.employee_id === employeeId);
    const approvedLoans = empLoans.filter((l) => l.status === "ACTIVE");
    const empSlips = (this.data.payslips || []).filter((p) => p.employee_id === employeeId);
    const totalRepaidLoans = empSlips.reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
    const totalLoanAmount = approvedLoans.reduce((sum, l) => sum + l.amount, 0);
    const recovery_loan_outstanding = Math.max(0, totalLoanAmount - totalRepaidLoans);
    const recovery_asset = 0;
    const recovery_other = 0;
    const ledger = this.data.compoff_ledger || [];
    const empLedger = ledger.filter((l) => l.employee_id === employeeId);
    const leave_balance_compoff = empLedger.reduce((sum, item) => sum + (item.balance || 0), 0);
    const pending_bonus = 0;
    const gross_earnings = gratuity_earned + earned_leave_encashment + unpaid_salary_earned + pending_bonus;
    const gross_deductions = notice_period_deduction + recovery_salary_advance + recovery_loan_outstanding + recovery_asset + recovery_other;
    const net_settlement_pay = gross_earnings - gross_deductions;
    const years = Math.floor(serviceYears);
    const totalDays = Math.floor(diffMs / (1e3 * 60 * 60 * 24));
    const months = Math.floor(totalDays % 365 / 30);
    const remainingDays = totalDays % 30;
    let tenureStr = "";
    if (years > 0) tenureStr += `${years} Year${years > 1 ? "s" : ""} `;
    if (months > 0) tenureStr += `${months} Month${months > 1 ? "s" : ""} `;
    tenureStr += `${remainingDays} Day${remainingDays !== 1 ? "s" : ""}`;
    if (!tenureStr.trim()) tenureStr = "0 Days";
    const nextId = `FF-${emp.id}`;
    const fAndF = {
      id: nextId,
      employee_id: emp.id,
      employee_name: emp.name,
      company: emp.company,
      last_working_day: lastDay,
      gratuity_earned,
      earned_leave_encashment,
      unpaid_salary_days,
      unpaid_salary_earned,
      notice_period_deduction,
      pending_bonus,
      gross_earnings,
      gross_deductions,
      net_settlement_pay,
      status: "DRAFT",
      // Profile details
      department: emp.department || "General",
      designation: emp.designation || "Staff",
      reporting_manager: emp.reporting_hod_name || emp.reporting_hod || "Management",
      joining_date: emp.joining_date,
      resignation_date: new Date(exitDate.getTime() - 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      resignation_acceptance_date: new Date(exitDate.getTime() - 25 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      leaving_date: lastDay,
      total_service_period: tenureStr,
      // Exit details
      reason_for_leaving: "Personal Reasons",
      exit_remarks: "Completed knowledge transfer and handed over all corporate assets.",
      // Notice period
      notice_applicable_days,
      notice_served_days,
      notice_shortfall_days,
      // Leaves
      leave_balance_pl: active_pl,
      leave_balance_cl: active_cl,
      leave_balance_sl: active_sl,
      leave_balance_compoff,
      // Recoveries
      recovery_salary_advance,
      recovery_loan_outstanding,
      recovery_asset,
      recovery_other,
      // Clearance Checklist
      clearance_id_card: true,
      clearance_laptop: true,
      clearance_mobile: true,
      clearance_access_card: true,
      clearance_other_assets: true,
      clearance_remarks: "All clearances obtained successfully from IT, HR, and Admin departments.",
      // Sign-offs
      approval_prepared_by: "",
      approval_prepared_date: "",
      approval_verified_by: "",
      approval_verified_date: "",
      approval_approved_by: "",
      approval_approved_date: "",
      approval_final_approved_by: "",
      approval_final_approved_date: ""
    };
    return fAndF;
  }
  saveFFSettlement(settlement) {
    if (!this.data.ff_settlements) this.data.ff_settlements = [];
    const idx = this.data.ff_settlements.findIndex((f) => f.id === settlement.id);
    if (idx !== -1) {
      this.data.ff_settlements[idx] = settlement;
    } else {
      this.data.ff_settlements.push(settlement);
    }
    if (settlement.status === "DISBURSED") {
      const emp = this.getEmployeeById(settlement.employee_id);
      if (emp) {
        emp.status = "RESIGNED";
        emp.exit_date = settlement.last_working_day;
        this.syncEmployee(emp);
      }
    }
    this.persistData();
    const serialized = JSON.stringify(settlement);
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO ff_settlements (id, employee_id, employee_name, company, last_working_day, gratuity_earned, earned_leave_encashment, unpaid_salary_days, unpaid_salary_earned, notice_period_deduction, pending_bonus, gross_earnings, gross_deductions, net_settlement_pay, status, meta_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        settlement.id,
        settlement.employee_id,
        settlement.employee_name,
        settlement.company,
        settlement.last_working_day,
        settlement.gratuity_earned,
        settlement.earned_leave_encashment,
        settlement.unpaid_salary_days,
        settlement.unpaid_salary_earned,
        settlement.notice_period_deduction,
        settlement.pending_bonus || 0,
        settlement.gross_earnings,
        settlement.gross_deductions,
        settlement.net_settlement_pay,
        settlement.status,
        serialized
      ],
      (err) => {
        if (err) console.error("SQLite Sync Error on F&F:", err);
      }
    );
  }
  // Form 16 Tax Estimation engine
  calculateForm16(employeeId) {
    const emp = this.getEmployeeById(employeeId);
    if (!emp) throw new Error("Employee not found for Form 16 calculation");
    const monthlyGross = emp.base_salary + emp.hra + emp.special_allowance + (emp.conveyance_allowance || 0) + (emp.edu_allowance || 0) + (emp.medical_allowance || 0);
    const gross_annual_salary = monthlyGross * 12;
    const standard_deduction = 5e4;
    let section_80c = 0;
    if (emp.pf_opt_in) {
      const pfContributionBasis = emp.base_salary;
      section_80c = Math.min(15e4, Math.round(pfContributionBasis * 0.12 * 12));
    }
    const section_80d = 12500;
    const hra_exemption = Math.round(emp.hra * 12 * 0.9);
    const taxable_income = Math.max(0, gross_annual_salary - standard_deduction - section_80c - section_80d - hra_exemption);
    let tax_on_income = 0;
    if (taxable_income > 15e5) {
      tax_on_income = 15e4 + (taxable_income - 15e5) * 0.3;
    } else if (taxable_income > 1e6) {
      tax_on_income = 6e4 + (taxable_income - 1e6) * 0.2;
    } else if (taxable_income > 7e5) {
      tax_on_income = 3e4 + (taxable_income - 7e5) * 0.1;
    } else if (taxable_income > 3e5) {
      tax_on_income = (taxable_income - 3e5) * 0.05;
    }
    let rebate_87a = 0;
    if (taxable_income <= 7e5) {
      rebate_87a = tax_on_income;
    }
    const net_tax_payable = Math.max(0, tax_on_income - rebate_87a);
    return {
      employee_id: emp.id,
      employee_name: emp.name,
      company: emp.company,
      pan: emp.pan,
      gross_annual_salary,
      standard_deduction,
      section_80c,
      section_80d,
      hra_exemption,
      taxable_income,
      tax_on_income,
      rebate_87a,
      net_tax_payable
    };
  }
  // Core helper methods
  getEmployeeById(id) {
    return this.data.employees.find((e) => e.id === id);
  }
  getPayrollRuns() {
    return this.data.payroll_runs || [];
  }
  getPayslipsByMonth(month, companyFilter) {
    let slips = this.data.payslips.filter((p) => p.month === month);
    if (companyFilter && companyFilter !== "ALL") {
      slips = slips.filter((p) => {
        const emp = this.getEmployeeById(p.employee_id);
        return emp?.company === companyFilter;
      });
    }
    return slips;
  }
  getPayslipById(id) {
    return this.data.payslips.find((p) => p.id === id);
  }
  getPayslipsByEmployee(employeeId) {
    if (!this.data.payslips) this.data.payslips = [];
    return this.data.payslips.filter((p) => p.employee_id === employeeId);
  }
  updatePayslipDeductions(id, pf, esic, pt, tds, loan, advance, custom) {
    const s = this.data.payslips.find((p) => p.id === id);
    if (!s) return null;
    s.pf_deduction = pf;
    s.esic_deduction = esic;
    s.professional_tax = pt;
    s.tds = tds;
    s.loan_deduction = loan;
    s.salary_advance = advance;
    s.custom_deductions = custom;
    s.total_deductions = s.pf_deduction + s.esic_deduction + s.professional_tax + s.tds + s.loan_deduction + s.salary_advance + s.custom_deductions;
    s.net_salary = Math.max(0, s.gross_salary - s.total_deductions);
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO payslips (
        id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month,
        rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance,
        earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance,
        overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction, salary_advance,
        gross_salary, total_deductions, net_salary, employer_pf, employer_esic, payment_status, payment_date, hidden_salary_heads, salary_structure_type,
        pay_days, calendar_days, rate_bonus_payable, earned_bonus_payable, ctc_salary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.employee_id,
        s.employee_name,
        s.designation,
        s.department,
        s.pan,
        s.uan,
        s.bank_name,
        s.bank_account,
        s.ifsc,
        s.month,
        s.rate_base_salary,
        s.rate_hra,
        s.rate_special_allowance,
        s.rate_da,
        s.rate_edu_allowance || 0,
        s.rate_medical_allowance || 0,
        s.rate_conveyance_allowance || 0,
        s.earned_base_salary,
        s.earned_hra,
        s.earned_special_allowance,
        s.earned_da,
        s.earned_edu_allowance || 0,
        s.earned_medical_allowance || 0,
        s.earned_conveyance_allowance || 0,
        s.overtime_pay,
        s.lop_deduction,
        s.pf_deduction,
        s.esic_deduction,
        s.professional_tax,
        s.tds,
        s.custom_deductions,
        s.loan_deduction,
        s.salary_advance || 0,
        s.gross_salary,
        s.total_deductions,
        s.net_salary,
        s.employer_pf,
        s.employer_esic,
        s.payment_status || "PENDING",
        s.payment_date || null,
        s.hidden_salary_heads || null,
        s.salary_structure_type || "FIXED",
        s.pay_days || 0,
        s.calendar_days || 30,
        s.rate_bonus_payable || 0,
        s.earned_bonus_payable || 0,
        s.ctc_salary || 0
      ]
    );
    this.persistData();
    return s;
  }
  // Helper: Get previous month string (e.g., '2026-04' -> '2026-03')
  getPreviousMonth(month) {
    const [year, mon] = month.split("-").map(Number);
    if (mon === 1) return `${year - 1}-12`;
    return `${year}-${String(mon - 1).padStart(2, "0")}`;
  }
  // Automation Calculation Logic for Single Employee Draft Wage Slip
  calculateSingleSlip(emp, att, month) {
    const totalDays = att.total_days || 30;
    const lopDays = att.lop_days || 0;
    const workDays = Math.max(0, totalDays - lopDays);
    const payDays = workDays;
    const proration = Math.max(0, workDays) / totalDays;
    const sets = this.getCompanySettings(emp.company);
    const isFormulaMonth = false;
    const isLockedPercentage = emp.salary_structure_type === "PERCENTAGE" || isFormulaMonth;
    const hiddenHeads = (emp.hidden_salary_heads || "").split(",").map((h) => h.trim());
    const isHidden = (head) => hiddenHeads.includes(head);
    const [mYear, mMon] = month.split("-").map(Number);
    const monthEnd = `${mYear}-${String(mMon).padStart(2, "0")}-${String(new Date(mYear, mMon, 0).getDate()).padStart(2, "0")}`;
    const allEmpRevisions = (this.data.salary_revisions || []).filter((r) => r.employee_code === emp.id).sort((a, b) => (a.effective_date || "").localeCompare(b.effective_date || ""));
    const applicableRevisions = allEmpRevisions.filter((r) => r.effective_date && r.effective_date <= monthEnd).sort((a, b) => (b.effective_date || "").localeCompare(a.effective_date || ""));
    let rate_base = emp.base_salary;
    let rate_hra_val = emp.hra ?? 0;
    let rate_special_val = emp.special_allowance ?? 0;
    let rate_edu_val = emp.edu_allowance && emp.edu_allowance > 0 ? emp.edu_allowance : 0;
    let rate_medical_val = emp.medical_allowance && emp.medical_allowance > 0 ? emp.medical_allowance : 0;
    let rate_conveyance_val = emp.conveyance_allowance && emp.conveyance_allowance > 0 ? emp.conveyance_allowance : 0;
    if (applicableRevisions.length > 0) {
      const latestRev = applicableRevisions[0];
      rate_base = Number(latestRev.new_salary);
      const revFull = latestRev;
      if (revFull.hra !== void 0) rate_hra_val = Number(revFull.hra);
      if (revFull.special_allowance !== void 0) rate_special_val = Number(revFull.special_allowance);
      if (revFull.edu_allowance !== void 0) rate_edu_val = Number(revFull.edu_allowance);
      if (revFull.medical_allowance !== void 0) rate_medical_val = Number(revFull.medical_allowance);
      if (revFull.conveyance_allowance !== void 0) rate_conveyance_val = Number(revFull.conveyance_allowance);
    } else if (allEmpRevisions.length > 0) {
      const earliestRev = allEmpRevisions[0];
      rate_base = Number(earliestRev.old_salary);
      const revFull = earliestRev;
      if (revFull.hra !== void 0) rate_hra_val = Number(revFull.hra);
      if (revFull.special_allowance !== void 0) rate_special_val = Number(revFull.special_allowance);
      if (revFull.edu_allowance !== void 0) rate_edu_val = Number(revFull.edu_allowance);
      if (revFull.medical_allowance !== void 0) rate_medical_val = Number(revFull.medical_allowance);
      if (revFull.conveyance_allowance !== void 0) rate_conveyance_val = Number(revFull.conveyance_allowance);
    }
    let rate_hra = isHidden("hra") ? 0 : isLockedPercentage ? Math.round(rate_base * (sets.salary_hra_percent / 100)) : rate_hra_val;
    let rate_special = isHidden("special_allowance") ? 0 : isLockedPercentage ? Math.round(rate_base * (sets.salary_special_percent / 100)) : rate_special_val;
    const rate_da = 0;
    let rate_edu = isHidden("edu_allowance") ? 0 : isLockedPercentage ? Math.round(rate_base * (sets.salary_edu_percent || 2) / 100) : rate_edu_val > 0 ? rate_edu_val : Math.round(rate_base * (sets.salary_edu_percent || 2) / 100);
    let rate_medical = isHidden("medical_allowance") ? 0 : isLockedPercentage ? Math.round(rate_base * (sets.salary_medical_percent || 5) / 100) : rate_medical_val > 0 ? rate_medical_val : Math.round(rate_base * (sets.salary_medical_percent || 5) / 100);
    let rate_conveyance = isHidden("conveyance_allowance") ? 0 : isLockedPercentage ? Math.round(rate_base * (sets.salary_conveyance_percent || 8) / 100) : rate_conveyance_val > 0 ? rate_conveyance_val : Math.round(rate_base * (sets.salary_conveyance_percent || 8) / 100);
    const rate_bonus = Math.round(rate_base * 0.0833);
    const earned_base = Math.round(rate_base * proration);
    const earned_hra = Math.round(rate_hra * proration);
    const earned_special = Math.round(rate_special * proration);
    const earned_da = 0;
    const earned_edu = Math.round(rate_edu * proration);
    const earned_medical = Math.round(rate_medical * proration);
    const earned_conveyance = Math.round(rate_conveyance * proration);
    const earned_bonus = Math.round(rate_bonus * proration);
    const overtime_hours = att.overtime_hours || 0;
    const overtime_rate = Math.round(rate_base / (26 * 8) * 1.5) || 150;
    const overtime_pay = overtime_hours * overtime_rate;
    const gross_rate_full = rate_base + rate_hra + rate_special + rate_edu + rate_medical + rate_conveyance;
    const lop_deduction = Math.round(gross_rate_full * (lopDays / totalDays));
    const gross_salary = earned_base + earned_hra + earned_special + earned_edu + earned_medical + earned_conveyance;
    let pf_deduction = 0;
    let employer_pf = 0;
    if (emp.pf_opt_in) {
      const pf_basis = earned_base;
      pf_deduction = Math.round(pf_basis * 0.12);
      employer_pf = Math.round(pf_basis * (sets.pf_employer_rate / 100));
    }
    let esic_deduction = 0;
    let employer_esic = 0;
    const monthly_gross_cap_rate = rate_base + rate_hra + rate_special + rate_edu + rate_medical + rate_conveyance;
    if (emp.esic_opt_in && monthly_gross_cap_rate <= sets.esic_opt_in_threshold) {
      esic_deduction = Math.round(gross_salary * 75e-4);
      employer_esic = Math.round(gross_salary * (sets.esic_employer_rate / 100));
    }
    let professional_tax = 0;
    if (emp.professional_tax_opt_in) {
      if (gross_salary > 15e3) {
        professional_tax = 200;
      } else if (gross_salary > 1e4) {
        professional_tax = 150;
      }
    }
    let tds = 0;
    const annual_estimated_taxable = (gross_salary - pf_deduction - professional_tax) * 12;
    if (annual_estimated_taxable > 7e5) {
      const excess = annual_estimated_taxable - 7e5;
      tds = Math.round(excess * 0.1 / 12);
    }
    const prevMonth = this.getPreviousMonth(month);
    const prevSlip = (this.data.payslips || []).find((p) => p.employee_id === emp.id && p.month === prevMonth);
    const prevTds = prevSlip?.tds || 0;
    const prevCustom = prevSlip?.custom_deductions || 0;
    const prevAdvance = prevSlip?.salary_advance || 0;
    let loan_deduction = 0;
    const activeLoans = (this.data.loans || []).filter((l) => {
      if (l.employee_id !== emp.id) return false;
      if (l.status !== "ACTIVE" && l.status !== "NONE" && l.status !== void 0 && l.status !== null) return false;
      const loanStart = l.emi_start_month || l.opening_date?.substring(0, 7) || "2026-04";
      if (loanStart > month) return false;
      return true;
    });
    for (const l of activeLoans) {
      const skipped = Array.isArray(l.skipped_months) ? l.skipped_months : [];
      if (skipped.includes(month)) {
        continue;
      }
      const openingBal = l.opening_balance !== void 0 ? Number(l.opening_balance) : Number(l.amount || 0);
      const additionalTotal = (l.additional_loans || []).filter((a) => !a.month || a.month <= month).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const totalLoanAmount = openingBal + additionalTotal;
      const previousDeductions = this.data.payslips.filter((p) => p.employee_id === emp.id && p.month !== month).reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
      const remaining = Math.max(0, totalLoanAmount - previousDeductions);
      if (remaining > 0) {
        const deduct = Math.min(Number(l.monthly_deduction || 0), remaining);
        loan_deduction += deduct;
      }
    }
    const existingSlip = (this.data.payslips || []).find((p) => p.id === `SLIP-${emp.id}-${month}`);
    if (existingSlip && existingSlip.rate_base_salary) {
      rate_base = existingSlip.rate_base_salary;
      rate_hra = existingSlip.rate_hra || rate_hra;
      rate_special = existingSlip.rate_special_allowance || rate_special;
      rate_edu = existingSlip.rate_edu_allowance || rate_edu;
      rate_medical = existingSlip.rate_medical_allowance || rate_medical;
      rate_conveyance = existingSlip.rate_conveyance_allowance || rate_conveyance;
    }
    const tdsVal = existingSlip?.tds !== void 0 ? existingSlip.tds : prevTds > 0 ? prevTds : tds;
    const customDed = existingSlip?.custom_deductions !== void 0 ? existingSlip.custom_deductions || 0 : prevCustom;
    const advanceDed = existingSlip?.salary_advance !== void 0 ? existingSlip.salary_advance || 0 : prevAdvance;
    const canteenDed = existingSlip?.canteen_deduction || 0;
    const uniformDed = existingSlip?.uniform_deduction || 0;
    const noticeDed = existingSlip?.notice_deduction || 0;
    const mobileDed = existingSlip?.mobile_deduction || 0;
    const damageDed = existingSlip?.damage_deduction || 0;
    const bonusInc = existingSlip?.bonus_incentive || 0;
    const perfInc = existingSlip?.performance_incentive || 0;
    const attInc = existingSlip?.attendance_incentive || 0;
    const prodInc = existingSlip?.production_incentive || 0;
    const reimb = existingSlip?.reimbursement || 0;
    const specAdd = existingSlip?.special_allowance_addition || 0;
    const arrearPay = existingSlip?.arrear_payment || 0;
    const otherEarn = existingSlip?.other_earnings || 0;
    const remarksText = existingSlip?.remarks || "";
    const varEarnings = bonusInc + perfInc + attInc + prodInc + reimb + specAdd + arrearPay + otherEarn;
    const final_gross_salary = gross_salary + varEarnings;
    const varDeductions = customDed + advanceDed;
    const total_deductions = pf_deduction + esic_deduction + tdsVal + loan_deduction + varDeductions;
    const net_salary = Math.max(0, final_gross_salary - total_deductions);
    if (earned_bonus > 0) {
      const bonusId = `BONUS-${emp.id}-${month}`;
      const existingBonus = this.data.bonus_provisions?.find((b) => b.id === bonusId);
      if (!existingBonus) {
        if (!this.data.bonus_provisions) this.data.bonus_provisions = [];
        this.data.bonus_provisions.push({
          id: bonusId,
          employee_id: emp.id,
          employee_name: emp.name,
          company: emp.company,
          month,
          base_salary: rate_base,
          bonus_rate: 8.33,
          bonus_amount: earned_bonus,
          status: "ACCUMULATED",
          paid_in_month: null,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        });
        try {
          this.dbSqlite.run(`INSERT OR REPLACE INTO bonus_provisions (id, employee_id, employee_name, company, month, base_salary, bonus_rate, bonus_amount, status, paid_in_month, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            bonusId,
            emp.id,
            emp.name,
            emp.company,
            month,
            rate_base,
            8.33,
            earned_bonus,
            "ACCUMULATED",
            null,
            (/* @__PURE__ */ new Date()).toISOString()
          ]);
        } catch (e) {
          console.error("[Bonus] Insert error:", e?.message);
        }
      }
    }
    const ctc_salary = final_gross_salary + employer_pf + employer_esic + earned_bonus;
    return {
      id: `SLIP-${emp.id}-${month}`,
      employee_id: emp.id,
      employee_name: emp.name,
      designation: emp.designation,
      department: emp.department,
      pan: emp.pan,
      uan: emp.uan,
      bank_name: emp.bank_name,
      bank_account: emp.bank_account,
      ifsc: emp.ifsc,
      month,
      rate_base_salary: rate_base,
      rate_hra,
      rate_special_allowance: rate_special,
      rate_da,
      rate_edu_allowance: rate_edu,
      rate_medical_allowance: rate_medical,
      rate_conveyance_allowance: rate_conveyance,
      earned_base_salary: earned_base,
      earned_hra,
      earned_special_allowance: earned_special,
      earned_da,
      earned_edu_allowance: earned_edu,
      earned_medical_allowance: earned_medical,
      earned_conveyance_allowance: earned_conveyance,
      overtime_pay,
      lop_deduction,
      pf_deduction,
      esic_deduction,
      professional_tax,
      tds: tdsVal,
      custom_deductions: customDed,
      loan_deduction,
      salary_advance: advanceDed,
      canteen_deduction: 0,
      uniform_deduction: 0,
      notice_deduction: 0,
      mobile_deduction: 0,
      damage_deduction: 0,
      bonus_incentive: bonusInc,
      performance_incentive: perfInc,
      attendance_incentive: attInc,
      production_incentive: prodInc,
      reimbursement: reimb,
      special_allowance_addition: specAdd,
      arrear_payment: arrearPay,
      other_earnings: otherEarn,
      remarks: remarksText,
      gross_salary: final_gross_salary,
      total_deductions,
      net_salary,
      employer_pf,
      employer_esic,
      rate_bonus_payable: rate_bonus,
      earned_bonus_payable: earned_bonus,
      ctc_salary,
      hidden_salary_heads: emp.hidden_salary_heads || "",
      salary_structure_type: emp.salary_structure_type || "FIXED",
      pay_days: workDays,
      calendar_days: totalDays,
      total_days: totalDays,
      // LEAVE/ATTENDANCE SNAPSHOT: Freeze attendance data at calculation time.
      // These values are immutable once the payslip is created.
      snapshot_present: att.present || 0,
      snapshot_leave: att.leave || 0,
      snapshot_weekly_off: att.weekly_off || 0,
      snapshot_absent: att.absent || 0,
      snapshot_lop_days: lopDays,
      snapshot_loan_emi: loan_deduction,
      snapshot_total_loan_active: activeLoans.length
    };
  }
  updatePayslipFullVariableInputs(id, inputs) {
    const s = this.data.payslips.find((p) => p.id === id);
    if (!s) return null;
    const run = this.data.payroll_runs.find((r) => r.month === s.month && r.status === "CLOSED");
    if (run) {
      throw new Error(`Payroll for ${s.month} is LOCKED/CLOSED. Cannot modify payslip ${id}. Unlock the payroll first.`);
    }
    if (inputs.rate_base_salary !== void 0) s.rate_base_salary = Number(inputs.rate_base_salary);
    if (inputs.rate_hra !== void 0) s.rate_hra = Number(inputs.rate_hra);
    if (inputs.rate_edu_allowance !== void 0) s.rate_edu_allowance = Number(inputs.rate_edu_allowance);
    if (inputs.rate_medical_allowance !== void 0) s.rate_medical_allowance = Number(inputs.rate_medical_allowance);
    if (inputs.rate_conveyance_allowance !== void 0) s.rate_conveyance_allowance = Number(inputs.rate_conveyance_allowance);
    if (inputs.rate_special_allowance !== void 0) s.rate_special_allowance = Number(inputs.rate_special_allowance);
    if (inputs.rate_da !== void 0) s.rate_da = Number(inputs.rate_da);
    s.earned_base_salary = s.rate_base_salary;
    s.earned_hra = s.rate_hra;
    s.earned_edu_allowance = s.rate_edu_allowance;
    s.earned_medical_allowance = s.rate_medical_allowance;
    s.earned_conveyance_allowance = s.rate_conveyance_allowance;
    s.earned_special_allowance = s.rate_special_allowance;
    s.earned_da = s.rate_da;
    if (inputs.pay_days !== void 0) {
      const newPayDays = Number(inputs.pay_days);
      const totalDays = s.total_days || 30;
      s.pay_days = newPayDays;
      s.lop_days = inputs.lop_days !== void 0 ? Number(inputs.lop_days) : totalDays - newPayDays;
      const proration = Math.max(0, newPayDays) / totalDays;
      s.earned_base_salary = Math.round(s.rate_base_salary * proration);
      s.earned_hra = Math.round(s.rate_hra * proration);
      s.earned_special_allowance = Math.round(s.rate_special_allowance * proration);
      s.earned_edu_allowance = Math.round((s.rate_edu_allowance || 0) * proration);
      s.earned_medical_allowance = Math.round((s.rate_medical_allowance || 0) * proration);
      s.earned_conveyance_allowance = Math.round((s.rate_conveyance_allowance || 0) * proration);
      s.lop_deduction = Math.round((s.rate_base_salary + (s.rate_hra || 0) + (s.rate_special_allowance || 0)) * (s.lop_days / totalDays));
      if (s.pf_deduction > 0) s.pf_deduction = Math.round(s.earned_base_salary * 0.12);
    }
    s.tds = (inputs.tds ?? inputs.tds) !== void 0 ? Number(inputs.tds ?? inputs.tds) : s.tds || 0;
    s.pf_deduction = (inputs.pf_deduction ?? inputs.pf) !== void 0 ? Number(inputs.pf_deduction ?? inputs.pf) : s.pf_deduction || 0;
    s.loan_deduction = (inputs.loan_deduction ?? inputs.loan) !== void 0 ? Number(inputs.loan_deduction ?? inputs.loan) : s.loan_deduction || 0;
    s.esic_deduction = (inputs.esic_deduction ?? inputs.esic) !== void 0 ? Number(inputs.esic_deduction ?? inputs.esic) : s.esic_deduction || 0;
    s.professional_tax = (inputs.professional_tax ?? inputs.pt) !== void 0 ? Number(inputs.professional_tax ?? inputs.pt) : s.professional_tax || 0;
    s.custom_deductions = (inputs.custom_deductions ?? inputs.custom) !== void 0 ? Number(inputs.custom_deductions ?? inputs.custom) : s.custom_deductions || 0;
    s.salary_advance = (inputs.salary_advance ?? inputs.advance) !== void 0 ? Number(inputs.salary_advance ?? inputs.advance) : s.salary_advance || 0;
    s.canteen_deduction = inputs.canteen_deduction !== void 0 ? Number(inputs.canteen_deduction) : s.canteen_deduction || 0;
    s.uniform_deduction = inputs.uniform_deduction !== void 0 ? Number(inputs.uniform_deduction) : s.uniform_deduction || 0;
    s.notice_deduction = inputs.notice_deduction !== void 0 ? Number(inputs.notice_deduction) : s.notice_deduction || 0;
    s.mobile_deduction = inputs.mobile_deduction !== void 0 ? Number(inputs.mobile_deduction) : s.mobile_deduction || 0;
    s.damage_deduction = inputs.damage_deduction !== void 0 ? Number(inputs.damage_deduction) : s.damage_deduction || 0;
    s.bonus_incentive = inputs.bonus_incentive !== void 0 ? Number(inputs.bonus_incentive) : s.bonus_incentive || 0;
    s.performance_incentive = inputs.performance_incentive !== void 0 ? Number(inputs.performance_incentive) : s.performance_incentive || 0;
    s.attendance_incentive = inputs.attendance_incentive !== void 0 ? Number(inputs.attendance_incentive) : s.attendance_incentive || 0;
    s.production_incentive = inputs.production_incentive !== void 0 ? Number(inputs.production_incentive) : s.production_incentive || 0;
    s.reimbursement = inputs.reimbursement !== void 0 ? Number(inputs.reimbursement) : s.reimbursement || 0;
    s.special_allowance_addition = inputs.special_allowance_addition !== void 0 ? Number(inputs.special_allowance_addition) : s.special_allowance_addition || 0;
    s.arrear_payment = inputs.arrear_payment !== void 0 ? Number(inputs.arrear_payment) : s.arrear_payment || 0;
    s.other_earnings = inputs.other_earnings !== void 0 ? Number(inputs.other_earnings) : s.other_earnings || 0;
    s.remarks = inputs.remarks !== void 0 ? String(inputs.remarks) : s.remarks || "";
    const baseGross = s.earned_base_salary + s.earned_hra + s.earned_special_allowance + (s.earned_edu_allowance || 0) + (s.earned_medical_allowance || 0) + (s.earned_conveyance_allowance || 0);
    const varEarnings = (s.bonus_incentive || 0) + (s.performance_incentive || 0) + (s.attendance_incentive || 0) + (s.production_incentive || 0) + (s.reimbursement || 0) + (s.special_allowance_addition || 0) + (s.arrear_payment || 0) + (s.other_earnings || 0);
    s.gross_salary = baseGross + varEarnings;
    const varDeductions = (s.custom_deductions || 0) + (s.canteen_deduction || 0) + (s.uniform_deduction || 0) + (s.notice_deduction || 0) + (s.mobile_deduction || 0) + (s.damage_deduction || 0) + (s.salary_advance || 0);
    s.total_deductions = s.pf_deduction + s.esic_deduction + s.professional_tax + s.tds + s.loan_deduction + varDeductions;
    s.net_salary = Math.max(0, s.gross_salary - s.total_deductions);
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO payslips (
        id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month,
        rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance,
        earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance,
        overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction, salary_advance,
        gross_salary, total_deductions, net_salary, employer_pf, employer_esic, payment_status, payment_date, hidden_salary_heads, salary_structure_type,
        bonus_incentive, performance_incentive, attendance_incentive, production_incentive, reimbursement, special_allowance_addition,
        arrear_payment, other_earnings, canteen_deduction, uniform_deduction, notice_deduction, mobile_deduction, damage_deduction, remarks,
        pay_days, calendar_days, rate_bonus_payable, earned_bonus_payable, ctc_salary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        s.id,
        s.employee_id,
        s.employee_name,
        s.designation,
        s.department,
        s.pan,
        s.uan,
        s.bank_name,
        s.bank_account,
        s.ifsc,
        s.month,
        s.rate_base_salary,
        s.rate_hra,
        s.rate_special_allowance,
        s.rate_da,
        s.rate_edu_allowance || 0,
        s.rate_medical_allowance || 0,
        s.rate_conveyance_allowance || 0,
        s.earned_base_salary,
        s.earned_hra,
        s.earned_special_allowance,
        s.earned_da,
        s.earned_edu_allowance || 0,
        s.earned_medical_allowance || 0,
        s.earned_conveyance_allowance || 0,
        s.overtime_pay,
        s.lop_deduction,
        s.pf_deduction,
        s.esic_deduction,
        s.professional_tax,
        s.tds,
        s.custom_deductions,
        s.loan_deduction,
        s.salary_advance || 0,
        s.gross_salary,
        s.total_deductions,
        s.net_salary,
        s.employer_pf,
        s.employer_esic,
        s.payment_status || "PENDING",
        s.payment_date || null,
        s.hidden_salary_heads || null,
        s.salary_structure_type || "FIXED",
        s.bonus_incentive || 0,
        s.performance_incentive || 0,
        s.attendance_incentive || 0,
        s.production_incentive || 0,
        s.reimbursement || 0,
        s.special_allowance_addition || 0,
        s.arrear_payment || 0,
        s.other_earnings || 0,
        s.canteen_deduction || 0,
        s.uniform_deduction || 0,
        s.notice_deduction || 0,
        s.mobile_deduction || 0,
        s.damage_deduction || 0,
        s.remarks || "",
        s.pay_days || 0,
        s.calendar_days || 30,
        s.rate_bonus_payable || 0,
        s.earned_bonus_payable || 0,
        s.ctc_salary || 0
      ]
    );
    this.persistData();
    return s;
  }
  runPayroll(month, companyFilter) {
    const existingSlipsForMonth = this.data.payslips.filter((p) => p.month === month);
    const savedManualInputs = {};
    for (const es of existingSlipsForMonth) {
      savedManualInputs[es.employee_id] = {
        tds: es.tds,
        custom_deductions: es.custom_deductions,
        salary_advance: es.salary_advance,
        // NOTE: loan_deduction is AUTO-CALCULATED from Loan Register - do NOT preserve
        bonus_incentive: es.bonus_incentive,
        performance_incentive: es.performance_incentive,
        attendance_incentive: es.attendance_incentive,
        production_incentive: es.production_incentive,
        reimbursement: es.reimbursement,
        special_allowance_addition: es.special_allowance_addition,
        arrear_payment: es.arrear_payment,
        other_earnings: es.other_earnings,
        remarks: es.remarks
      };
    }
    if (companyFilter && companyFilter !== "ALL") {
      this.data.payslips = this.data.payslips.filter((p) => {
        const emp = this.getEmployeeById(p.employee_id);
        const matchMonth = p.month === month;
        return !(matchMonth && emp?.company === companyFilter);
      });
      this.data.payroll_runs = this.data.payroll_runs.filter((r) => !(r.month === month && r.id.includes(companyFilter)));
      this.dbSqlite.run(`DELETE FROM payslips WHERE month = ? AND employee_id IN (SELECT id FROM employees WHERE company = ?)`, [month, companyFilter]);
      this.dbSqlite.run(`DELETE FROM payroll_runs WHERE month = ? AND id LIKE ?`, [month, `%${companyFilter}%`]);
    } else {
      this.data.payslips = this.data.payslips.filter((p) => p.month !== month);
      this.data.payroll_runs = this.data.payroll_runs.filter((r) => r.month !== month);
      this.dbSqlite.run(`DELETE FROM payslips WHERE month = ?`, [month]);
      this.dbSqlite.run(`DELETE FROM payroll_runs WHERE month = ?`, [month]);
    }
    const activeSlips = [];
    let gross_sum = 0;
    let deduct_sum = 0;
    let net_sum = 0;
    const existingRun = this.data.payroll_runs.find((r) => {
      const matchMonth = r.month === month;
      if (companyFilter && companyFilter !== "ALL") {
        return matchMonth && r.id.includes(companyFilter);
      }
      return matchMonth;
    });
    if (existingRun && existingRun.status === "CLOSED") {
      throw new Error(`Payroll for ${month} is LOCKED. Unlock it first before recalculating.`);
    }
    const targets = this.getEmployees(companyFilter).filter((e) => e.status === "ACTIVE");
    for (const emp of targets) {
      let att = this.data.attendance.find((a) => a.employee_id === emp.id && a.month === month);
      if (!att) {
        console.log(`[Payroll] SKIP ${emp.id} (${emp.name}) \u2014 No attendance record for ${month}`);
        continue;
      }
      const slip = this.calculateSingleSlip(emp, att, month);
      const saved = savedManualInputs[emp.id];
      if (saved) {
        if (saved.tds !== void 0) slip.tds = saved.tds;
        if (saved.custom_deductions !== void 0) slip.custom_deductions = saved.custom_deductions;
        if (saved.salary_advance !== void 0) slip.salary_advance = saved.salary_advance;
        if (saved.loan_deduction !== void 0 && saved.loan_deduction !== 0) slip.loan_deduction = saved.loan_deduction;
        if (saved.bonus_incentive !== void 0) slip.bonus_incentive = saved.bonus_incentive;
        if (saved.performance_incentive !== void 0) slip.performance_incentive = saved.performance_incentive;
        if (saved.attendance_incentive !== void 0) slip.attendance_incentive = saved.attendance_incentive;
        if (saved.production_incentive !== void 0) slip.production_incentive = saved.production_incentive;
        if (saved.reimbursement !== void 0) slip.reimbursement = saved.reimbursement;
        if (saved.special_allowance_addition !== void 0) slip.special_allowance_addition = saved.special_allowance_addition;
        if (saved.arrear_payment !== void 0) slip.arrear_payment = saved.arrear_payment;
        if (saved.other_earnings !== void 0) slip.other_earnings = saved.other_earnings;
        if (saved.remarks !== void 0) slip.remarks = saved.remarks;
        const varDeductions = (slip.custom_deductions || 0) + (slip.salary_advance || 0);
        slip.total_deductions = (slip.pf_deduction || 0) + (slip.esic_deduction || 0) + (slip.tds || 0) + (slip.loan_deduction || 0) + varDeductions;
        slip.net_salary = Math.max(0, slip.gross_salary - slip.total_deductions);
      }
      activeSlips.push(slip);
      gross_sum += slip.gross_salary;
      deduct_sum += slip.total_deductions;
      net_sum += slip.net_salary;
    }
    this.data.payslips.push(...activeSlips);
    const suffix = companyFilter && companyFilter !== "ALL" ? `-${companyFilter}` : "";
    const newRun = {
      id: `RUN-${month}${suffix}`,
      month,
      status: "DRAFT",
      processed_at: (/* @__PURE__ */ new Date()).toISOString(),
      total_employees: activeSlips.length,
      total_gross: gross_sum,
      total_deductions: deduct_sum,
      total_net: net_sum
    };
    this.data.payroll_runs.push(newRun);
    this.dbSqlite.serialize(() => {
      this.dbSqlite.run(
        `INSERT OR REPLACE INTO payroll_runs (id, month, status, processed_at, total_employees, total_gross, total_deductions, total_net) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newRun.id, newRun.month, newRun.status, newRun.processed_at, newRun.total_employees, newRun.total_gross, newRun.total_deductions, newRun.total_net]
      );
      for (const s of activeSlips) {
        s.payment_status = "PENDING";
        s.payment_date = "";
        this.dbSqlite.run(
          `INSERT OR REPLACE INTO payslips (id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month, rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance, earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance, overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction, salary_advance, gross_salary, total_deductions, net_salary, employer_pf, employer_esic, payment_status, payment_date, hidden_salary_heads, salary_structure_type, pay_days, calendar_days, bonus_incentive, performance_incentive, attendance_incentive, production_incentive, reimbursement, special_allowance_addition, arrear_payment, other_earnings, canteen_deduction, uniform_deduction, notice_deduction, mobile_deduction, damage_deduction, remarks, rate_bonus_payable, earned_bonus_payable, ctc_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            s.id,
            s.employee_id,
            s.employee_name,
            s.designation,
            s.department,
            s.pan,
            s.uan,
            s.bank_name,
            s.bank_account,
            s.ifsc,
            s.month,
            s.rate_base_salary,
            s.rate_hra,
            s.rate_special_allowance,
            s.rate_da,
            s.rate_edu_allowance || 0,
            s.rate_medical_allowance || 0,
            s.rate_conveyance_allowance || 0,
            s.earned_base_salary,
            s.earned_hra,
            s.earned_special_allowance,
            s.earned_da,
            s.earned_edu_allowance || 0,
            s.earned_medical_allowance || 0,
            s.earned_conveyance_allowance || 0,
            s.overtime_pay,
            s.lop_deduction,
            s.pf_deduction,
            s.esic_deduction,
            s.professional_tax,
            s.tds,
            s.custom_deductions,
            s.loan_deduction,
            s.salary_advance || 0,
            s.gross_salary,
            s.total_deductions,
            s.net_salary,
            s.employer_pf,
            s.employer_esic,
            s.payment_status,
            s.payment_date,
            s.hidden_salary_heads || null,
            s.salary_structure_type || "FIXED",
            s.pay_days || 0,
            s.calendar_days || 30,
            s.bonus_incentive || 0,
            s.performance_incentive || 0,
            s.attendance_incentive || 0,
            s.production_incentive || 0,
            s.reimbursement || 0,
            s.special_allowance_addition || 0,
            s.arrear_payment || 0,
            s.other_earnings || 0,
            s.canteen_deduction || 0,
            s.uniform_deduction || 0,
            s.notice_deduction || 0,
            s.mobile_deduction || 0,
            s.damage_deduction || 0,
            s.remarks || "",
            s.rate_bonus_payable || 0,
            s.earned_bonus_payable || 0,
            s.ctc_salary || 0
          ]
        );
      }
    });
    this.persistData();
    return newRun;
  }
  closePayroll(month, companyFilter) {
    const suffix = companyFilter && companyFilter !== "ALL" ? `-${companyFilter}` : "";
    const run = this.data.payroll_runs.find((r) => r.month === month && r.id === `RUN-${month}${suffix}`);
    if (!run) return false;
    run.status = "CLOSED";
    this.dbSqlite.run(`UPDATE payroll_runs SET status = 'CLOSED' WHERE id = ?`, [run.id]);
    this.persistData();
    return true;
  }
  payPayslips(month, companyFilter, paymentDate) {
    const payDate = paymentDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const matchingSlips = this.data.payslips.filter((s) => {
      if (s.month !== month) return false;
      if (companyFilter && companyFilter !== "ALL") {
        const emp = this.getEmployeeById(s.employee_id);
        if (!emp || emp.company !== companyFilter) return false;
      }
      return true;
    });
    const notifications = [];
    matchingSlips.forEach((s) => {
      s.payment_status = "PAID";
      s.payment_date = payDate;
      this.dbSqlite.run(`UPDATE payslips SET payment_status = 'PAID', payment_date = ? WHERE id = ?`, [payDate, s.id]);
      const last4 = s.bank_account ? s.bank_account.slice(-4) : "XXXX";
      const parts = month.split("-");
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthFormatted = parts.length === 2 ? `${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}` : month;
      const whatsappTemplate = `*SALARY CREDIT ALERT* \u{1F4B8}
      
Dear *${s.employee_name}*,

We are pleased to inform you that your salary for the month of *${monthFormatted}* has been successfully processed and credited.

\u{1F539} *Net Amount:* \u20B9${s.net_salary.toLocaleString("en-IN")}
\u{1F539} *Account:* ******${last4}
\u{1F539} *Date:* ${payDate}
\u{1F539} *Status:* SUCCESS / CREDITED

You can download your detailed payslip from the employee portal. Thank you for your hard work!

Best regards,
*HR Operations Team*
_Sakar & SVN Group_`;
      const smsTemplate = `Alert: Dear ${s.employee_name}, your salary for ${monthFormatted} of INR ${s.net_salary.toLocaleString("en-IN")} has been credited to bank account ******${last4} on ${payDate}. Regards, HR Dept, Sakar Group.`;
      const emailTemplate = `Subject: Salary Credit Intimation - ${monthFormatted}

Dear ${s.employee_name} ({employee_id}),

This is to inform you that your salary for the month of ${monthFormatted} has been credited to your registered bank account on ${payDate}.

Disbursement Details:
------------------------------------
Employee Name:     ${s.employee_name}
Designation:       ${s.employee_id}
Bank Account:      ******${last4}
Net Salary Paid:   \u20B9${s.net_salary.toLocaleString("en-IN")}
------------------------------------

The detailed payslip is available for download on the Employee Self-Service (ESS) Portal. If you have any queries regarding your payroll calculation, please write to us at hr@sakarelectricals.com.

Thank you for your valuable contribution and dedication!

Sincerely,
HR & Payroll Team
Sakar & SVN Group`;
      notifications.push({
        employee_id: s.employee_id,
        employee_name: s.employee_name,
        whatsapp: whatsappTemplate,
        sms: smsTemplate,
        email: emailTemplate,
        amount: s.net_salary,
        date: payDate
      });
    });
    return {
      success: true,
      count: matchingSlips.length,
      notifications
    };
  }
  // Mark individual payslip as PAID
  markPayslipPaid(payslipId, paymentDate) {
    const slip = this.data.payslips.find((s) => s.id === payslipId);
    if (!slip) return false;
    slip.payment_status = "PAID";
    slip.payment_date = paymentDate;
    this.dbSqlite.run(`UPDATE payslips SET payment_status = 'PAID', payment_date = ? WHERE id = ?`, [paymentDate, payslipId]);
    return true;
  }
  // Company Master Module methods
  getCompanies() {
    if (!this.data.companies) this.data.companies = [];
    return this.data.companies;
  }
  addCompany(c) {
    if (!this.data.companies) this.data.companies = [];
    const idx = this.data.companies.findIndex((co) => co.id === c.id);
    if (idx >= 0) {
      this.data.companies[idx] = c;
    } else {
      this.data.companies.push(c);
    }
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO companies (id, name, unit_name, logo, registered_office, factory_address, gst_number, pan_number, tan_number, cin_number, pf_number, esic_number, pt_number, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.unit_name, c.logo, c.registered_office, c.factory_address, c.gst_number, c.pan_number, c.tan_number, c.cin_number, c.pf_number, c.esic_number, c.pt_number, c.settings || ""],
      (err) => {
        if (err) console.error("SQLite Sync Error on adding Company:", err);
      }
    );
    return c;
  }
  updateCompany(id, updated) {
    if (!this.data.companies) this.data.companies = [];
    const idx = this.data.companies.findIndex((c2) => c2.id === id);
    if (idx === -1) return void 0;
    this.data.companies[idx] = { ...this.data.companies[idx], ...updated };
    const c = this.data.companies[idx];
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO companies (id, name, unit_name, logo, registered_office, factory_address, gst_number, pan_number, tan_number, cin_number, pf_number, esic_number, pt_number, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.name, c.unit_name, c.logo, c.registered_office, c.factory_address, c.gst_number, c.pan_number, c.tan_number, c.cin_number, c.pf_number, c.esic_number, c.pt_number, c.settings || ""],
      (err) => {
        if (err) console.error("SQLite Sync Error on Companies:", err);
      }
    );
    return c;
  }
  // Salary Revision Module methods
  getSalaryRevisions(employeeCode) {
    if (!this.data.salary_revisions) this.data.salary_revisions = [];
    if (employeeCode) {
      return this.data.salary_revisions.filter((r) => r.employee_code === employeeCode);
    }
    return this.data.salary_revisions;
  }
  addSalaryRevision(rev) {
    if (!this.data.salary_revisions) this.data.salary_revisions = [];
    const newRev = {
      id: `REV-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      employee_code: rev.employee_code,
      old_salary: Number(rev.old_salary),
      new_salary: Number(rev.new_salary),
      effective_date: rev.effective_date,
      reason: rev.reason || "",
      approved_by: rev.approved_by || "Admin",
      remarks: rev.remarks || "",
      increment_amount: rev.increment_amount !== void 0 ? Number(rev.increment_amount) : Number(rev.new_salary) - Number(rev.old_salary),
      old_structure: rev.old_structure || "",
      new_structure: rev.new_structure || "",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.salary_revisions.push(newRev);
    this.persistData();
    this.dbSqlite.run(
      `INSERT INTO salary_revisions (id, employee_code, old_salary, new_salary, effective_date, reason, approved_by, created_at, remarks, increment_amount, old_structure, new_structure) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newRev.id,
        newRev.employee_code,
        newRev.old_salary,
        newRev.new_salary,
        newRev.effective_date,
        newRev.reason,
        newRev.approved_by,
        newRev.created_at,
        newRev.remarks,
        newRev.increment_amount,
        newRev.old_structure,
        newRev.new_structure
      ],
      (err) => {
        if (err) console.error("SQLite Sync Error on Salary Revisions:", err);
      }
    );
    const emp = this.getEmployeeById(rev.employee_code);
    if (emp) {
      const today = (/* @__PURE__ */ new Date()).toISOString().substring(0, 10);
      const effectiveDate = rev.effective_date || today;
      if (effectiveDate <= today) {
        emp.base_salary = rev.new_salary;
        emp.hra = rev.hra !== void 0 ? Number(rev.hra) : Math.round(rev.new_salary * 0.4);
        emp.special_allowance = rev.special_allowance !== void 0 ? Number(rev.special_allowance) : Math.round(rev.new_salary * 0.15);
        emp.da = 0;
        if (rev.conveyance_allowance !== void 0) emp.conveyance_allowance = Number(rev.conveyance_allowance);
        if (rev.edu_allowance !== void 0) emp.edu_allowance = Number(rev.edu_allowance);
        if (rev.medical_allowance !== void 0) emp.medical_allowance = Number(rev.medical_allowance);
        emp.ctc_salary = emp.base_salary + emp.hra + emp.special_allowance + (emp.conveyance_allowance || 0) + (emp.edu_allowance || 0) + (emp.medical_allowance || 0);
        this.syncEmployee(emp);
      }
    }
    return newRev;
  }
  deleteSalaryRevision(id) {
    if (!this.data.salary_revisions) this.data.salary_revisions = [];
    this.data.salary_revisions = this.data.salary_revisions.filter((r) => r.id !== id);
    this.persistData();
    this.dbSqlite.run(`DELETE FROM salary_revisions WHERE id = ?`, [id], (err) => {
      if (err) console.error("SQLite Sync Error on Salary Revision Delete:", err);
    });
  }
  updateSalaryRevision(id, updates) {
    if (!this.data.salary_revisions) this.data.salary_revisions = [];
    const rev = this.data.salary_revisions.find((r) => r.id === id);
    if (!rev) throw new Error("Revision not found");
    if (updates.old_salary !== void 0) rev.old_salary = Number(updates.old_salary);
    if (updates.new_salary !== void 0) rev.new_salary = Number(updates.new_salary);
    if (updates.effective_date !== void 0) rev.effective_date = updates.effective_date;
    if (updates.reason !== void 0) rev.reason = updates.reason;
    if (updates.remarks !== void 0) rev.remarks = updates.remarks;
    rev.increment_amount = Number(rev.new_salary) - Number(rev.old_salary);
    this.persistData();
    this.dbSqlite.run(
      `UPDATE salary_revisions SET old_salary=?, new_salary=?, effective_date=?, reason=?, remarks=?, increment_amount=? WHERE id=?`,
      [rev.old_salary, rev.new_salary, rev.effective_date, rev.reason, rev.remarks, rev.increment_amount, id],
      (err) => {
        if (err) console.error("SQLite Sync Error on Salary Revision Update:", err);
      }
    );
  }
  // Simple SQL analyzer 
  querySQL(sql) {
    const startTime = Date.now();
    try {
      let statement = sql.trim().replace(/\s+/g, " ");
      if (statement.endsWith(";")) {
        statement = statement.slice(0, -1).trim();
      }
      const upperStmt = statement.toUpperCase();
      if (upperStmt.startsWith("SELECT")) {
        return this.executeSelect(statement, startTime);
      } else {
        throw new Error("This ERP playground supports real-time SELECT queries across schema tables to audit compliance (e.g., SELECT * FROM employees)");
      }
    } catch (e) {
      return {
        success: false,
        error: `SQL Syntax Error: ${e.message}`,
        queryTimeMs: Date.now() - startTime
      };
    }
  }
  executeSelect(statement, startTime) {
    const selectMatch = statement.match(/^SELECT\s+(.*?)\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.*?))?(?:\s+ORDER\s+BY\s+(.*?))?$/i);
    if (!selectMatch) {
      throw new Error("Syntax error. Try SELECT * FROM employees [WHERE company = 'SVN-1']");
    }
    const colStr = selectMatch[1].trim();
    const tableName = selectMatch[2].trim().toLowerCase();
    const whereStr = selectMatch[3] ? selectMatch[3].trim() : "";
    const validTables = ["employees", "attendance", "payroll_runs", "payslips", "leave_applications", "ff_settlements", "companies", "salary_revisions", "loans"];
    if (!validTables.includes(tableName)) {
      throw new Error(`Table "${tableName}" is not valid. Choose from: ${validTables.join(", ")}`);
    }
    let keyDB = tableName;
    const rows = this.data[keyDB];
    if (!rows || rows.length === 0) {
      return {
        success: true,
        columns: colStr === "*" ? ["id"] : colStr.split(","),
        rows: [],
        queryTimeMs: Date.now() - startTime
      };
    }
    let filteredRows = [...rows];
    if (whereStr) {
      filteredRows = filteredRows.filter((row) => this.evaluateWhereCondition(row, whereStr));
    }
    const columns = colStr === "*" ? Object.keys(rows[0] || {}) : colStr.split(",").map((c) => c.trim());
    const visualRows = filteredRows.map((row) => {
      return columns.map((col) => {
        if (row[col] !== void 0) {
          if (typeof row[col] === "boolean") return row[col] ? "TRUE" : "FALSE";
          return row[col];
        }
        return "NULL";
      });
    });
    return {
      success: true,
      columns,
      rows: visualRows,
      queryTimeMs: Date.now() - startTime
    };
  }
  evaluateWhereCondition(row, conditionStr) {
    const regex = /([a-zA-Z0-9_.]+)\s*((?:[!=<>]=?)|LIKE)\s*(.*)/i;
    const match = conditionStr.match(regex);
    if (!match) {
      return row[conditionStr.trim()] ? true : false;
    }
    const key = match[1].trim();
    const op = match[2].trim().toUpperCase();
    let rValue = match[3].trim();
    if (rValue.startsWith("'") && rValue.endsWith("'")) {
      rValue = rValue.slice(1, -1);
    } else if (rValue.toUpperCase() === "TRUE") {
      rValue = true;
    } else if (rValue.toUpperCase() === "FALSE") {
      rValue = false;
    } else if (!isNaN(Number(rValue))) {
      rValue = Number(rValue);
    }
    const lValue = row[key];
    if (lValue === void 0) return false;
    if (op === "=" || op === "IS") return lValue == rValue;
    if (op === "!=") return lValue != rValue;
    if (op === "<") return lValue < rValue;
    if (op === ">") return lValue > rValue;
    if (op === "LIKE") {
      const matchPattern = String(rValue).replace(/%/g, ".*").replace(/_/g, ".");
      return new RegExp(`^${matchPattern}$`, "i").test(String(lValue));
    }
    return false;
  }
  // Audit Log, Payroll Lock and Database helpers
  logAudit(action, details, userName) {
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    const id = "AUDIT-" + Math.random().toString(36).substring(2, 11).toUpperCase();
    if (!this.data.audit_logs) {
      this.data.audit_logs = [];
    }
    this.data.audit_logs.push({
      id,
      action,
      details,
      user_name: userName || "Admin",
      timestamp
    });
    this.dbSqlite.run(
      `INSERT INTO audit_logs (id, action, details, user_name, timestamp) VALUES (?, ?, ?, ?, ?)`,
      [id, action, details, userName || "Admin", timestamp],
      (err) => {
        if (err) console.error("Error writing audit log:", err);
      }
    );
  }
  getAuditLogs() {
    return new Promise((resolve, reject) => {
      if (this.inMemoryOnly) {
        resolve(this.data.audit_logs || []);
        return;
      }
      this.dbSqlite.all(`SELECT * FROM audit_logs ORDER BY timestamp DESC`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
  isPayrollLocked(month, company) {
    const suffix = company && company !== "ALL" ? `-${company}` : "";
    const runId = `RUN-${month}${suffix}`;
    const run = this.data.payroll_runs.find((r) => r.id === runId);
    return !!(run && run.status === "CLOSED");
  }
  unlockPayroll(month, companyFilter) {
    const suffix = companyFilter && companyFilter !== "ALL" ? `-${companyFilter}` : "";
    const runId = `RUN-${month}${suffix}`;
    const run = this.data.payroll_runs.find((r) => r.id === runId);
    if (!run) return false;
    run.status = "DRAFT";
    this.dbSqlite.run(`UPDATE payroll_runs SET status = 'DRAFT' WHERE id = ?`, [run.id]);
    return true;
  }
  close() {
    return new Promise((resolve, reject) => {
      if (this.dbSqlite) {
        this.dbSqlite.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
  // --- Assets tracking ---
  getAssets(employeeId) {
    const list = this.data.assets || [];
    if (employeeId) {
      return list.filter((a) => a.employee_id === employeeId);
    }
    return list;
  }
  saveAsset(asset) {
    if (!this.data.assets) this.data.assets = [];
    const index = this.data.assets.findIndex((a) => a.id === asset.id);
    if (index >= 0) {
      this.data.assets[index] = asset;
    } else {
      this.data.assets.push(asset);
    }
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO assets (id, employee_id, employee_name, asset_name, serial_number, type, issue_date, return_date, status, condition) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [asset.id, asset.employee_id, asset.employee_name, asset.asset_name, asset.serial_number, asset.type, asset.issue_date, asset.return_date || null, asset.status, asset.condition]
    );
  }
  deleteAsset(id) {
    if (this.data.assets) {
      this.data.assets = this.data.assets.filter((a) => a.id !== id);
    }
    this.dbSqlite.run(`DELETE FROM assets WHERE id = ?`, [id]);
  }
  // --- Travel Allowance ---
  getTravelReimbursements(employeeId) {
    const list = this.data.travel_reimbursements || [];
    if (employeeId) {
      return list.filter((t) => t.employee_id === employeeId);
    }
    return list;
  }
  saveTravelReimbursement(reimb) {
    if (!this.data.travel_reimbursements) this.data.travel_reimbursements = [];
    const index = this.data.travel_reimbursements.findIndex((t) => t.id === reimb.id);
    if (index >= 0) {
      this.data.travel_reimbursements[index] = reimb;
    } else {
      this.data.travel_reimbursements.push(reimb);
    }
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO travel_reimbursements (id, employee_id, employee_name, month, fuel_liters, rate_per_liter, amount, travel_purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [reimb.id, reimb.employee_id, reimb.employee_name, reimb.month, reimb.fuel_liters, reimb.rate_per_liter, reimb.amount, reimb.travel_purpose, reimb.status]
    );
  }
  deleteTravelReimbursement(id) {
    if (this.data.travel_reimbursements) {
      this.data.travel_reimbursements = this.data.travel_reimbursements.filter((t) => t.id !== id);
    }
    this.dbSqlite.run(`DELETE FROM travel_reimbursements WHERE id = ?`, [id]);
  }
  // --- Broadcasts/Notice Board ---
  getBroadcasts() {
    return this.data.broadcasts || [];
  }
  saveBroadcast(notice) {
    if (!this.data.broadcasts) this.data.broadcasts = [];
    const index = this.data.broadcasts.findIndex((b) => b.id === notice.id);
    if (index >= 0) {
      this.data.broadcasts[index] = notice;
    } else {
      this.data.broadcasts.push(notice);
    }
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO broadcasts (id, title, message, target_type, target_value, created_at, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [notice.id, notice.title, notice.message, notice.target_type, notice.target_value, notice.created_at, notice.created_by]
    );
  }
  deleteBroadcast(id) {
    if (this.data.broadcasts) {
      this.data.broadcasts = this.data.broadcasts.filter((b) => b.id !== id);
    }
    this.dbSqlite.run(`DELETE FROM broadcasts WHERE id = ?`, [id]);
  }
  // --- Users management ---
  getUsers() {
    return this.data.users || [];
  }
  // --- Secure System Settings & PIN management ---
  getSystemSetting(key, defaultValue) {
    return new Promise((resolve) => {
      this.dbSqlite.all(`SELECT value FROM system_settings WHERE key = ?`, [key], (err, rows) => {
        if (err || !rows || rows.length === 0) {
          resolve(defaultValue);
        } else {
          resolve(rows[0].value);
        }
      });
    });
  }
  setSystemSetting(key, value) {
    return new Promise((resolve) => {
      this.dbSqlite.run(`INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)`, [key, value], () => {
        resolve();
      });
    });
  }
  // ===== Workforce Module (Phase A: calculation engine + lookups) =====
  // These are PURE helpers — they do NOT alter Staff Payroll or any existing calculation.
  // They are wired into PF/ESIC / Worker Payroll ONLY when feature flags are ON (Phase C+).
  // All existing behaviour stays 100% unchanged because flags default to OFF in this phase.
  /**
   * APPROVED rule — Full/Half day conversion of Wage-Equivalent Days.
   *
   *   WageEquivDays = GrossWages / MinimumWage
   *   BaseDays       = floor(WageEquivDays)
   *   DecimalPart    = WageEquivDays - BaseDays
   *   if DecimalPart < 0.50  -> CountedWageDays = BaseDays        (e.g. 22.40 -> 22,  22.49 -> 22)
   *   else                  -> CountedWageDays = BaseDays + 0.5   (e.g. 22.50 -> 22.5, 22.90 -> 22.5, NOT 23)
   *
   * NOTE: this is NOT standard rounding. Only 0.0 and 0.5 increments are ever produced.
   * Used ONLY inside PF Challan / ESIC Challan business-calculation layers.
   */
  calculateWageEquivalentDays(grossWages, minimumWage) {
    if (!minimumWage || minimumWage <= 0) return 0;
    const wageEquivDays = grossWages / minimumWage;
    const baseDays = Math.floor(wageEquivDays);
    const decimalPart = wageEquivDays - baseDays;
    return decimalPart < 0.5 ? baseDays : baseDays + 0.5;
  }
  /**
   * Business NCP for the PF/ESIC challan layer ONLY.
   *   applicableDays = MIN(paidDays, countedWageDays)
   *   businessNCP    = paidDays - applicableDays
   * Does NOT modify present/paid/gross/wage/bill/payment values.
   */
  calculateBusinessNCP(paidDays, grossWages, minimumWage) {
    const countedWageDays = this.calculateWageEquivalentDays(grossWages, minimumWage);
    const applicableDays = Math.min(paidDays, countedWageDays);
    const businessNcp = paidDays - applicableDays;
    return { countedWageDays, applicableDays, businessNcp };
  }
  /** Minimum-wage lookup with approved precedence (data-driven, never hard-coded):
   *  1) minimum_wage_rates table (company → unit → category → wage_group → effective date, most specific wins)
   *  2) company.settings JSON { minimum_wage }
   *  3) global 'min_wage_default' system setting (seeded = 511)
   */
  async getMinimumWage(company, opts = {}) {
    const asOf = opts.asOfDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const candidates = (this.data.minimum_wage_rates || []).filter((r) => r.active === 1 && r.company === company && r.effective_from <= asOf && (!r.effective_to || r.effective_to >= asOf)).filter((r) => {
      const matchUnit = !opts.unit || !r.unit || r.unit === opts.unit;
      const matchCat = !opts.workerCategory || !r.worker_category || r.worker_category === opts.workerCategory;
      const matchGroup = !opts.wageGroup || !r.wage_group || r.wage_group === opts.wageGroup;
      return matchUnit && matchCat && matchGroup;
    });
    if (candidates.length > 0) {
      candidates.sort((a, b) => this._mwSpecificity(b, opts) - this._mwSpecificity(a, opts));
      return Number(candidates[0].minimum_wage) || 0;
    }
    const comp = this.getCompanies().find((c) => c.id === company);
    if (comp && comp.settings) {
      try {
        const s = JSON.parse(typeof comp.settings === "string" ? comp.settings : comp.settings);
        if (s && s.minimum_wage != null) return Number(s.minimum_wage);
      } catch {
      }
    }
    if (this.dbSqlite && typeof this.dbSqlite.all === "function") {
      const g = await this.getSystemSetting("min_wage_default", "511");
      return Number(g || 511);
    }
    return 511;
  }
  /** Specificity score — exact unit/category/wage_group matches score higher than wildcard/blank. */
  _mwSpecificity(r, opts) {
    let s = 0;
    if (opts.unit && r.unit === opts.unit) s += 1;
    if (opts.workerCategory && r.worker_category === opts.workerCategory) s += 1;
    if (opts.wageGroup && r.wage_group === opts.wageGroup) s += 1;
    return s;
  }
  getFullBackupJSON() {
    return this.data;
  }
  async _persistToSupabaseWithRetry(maxRetries = 3) {
    if (!this.supabaseAdmin) return { ok: false, error: "No Supabase client" };
    if (this.loadedFromSeed) return { ok: false, error: "Loaded from seed \u2014 blocked" };
    const newUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const TIMEOUT_MS = 15e3;
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error(`Supabase persist timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
        );
        let writePromise;
        if (this._loadedVersion) {
          writePromise = this.supabaseAdmin.from("vetan_erp_store").update({ payload: this.data, updated_at: newUpdatedAt }).eq("id", "live").eq("updated_at", this._loadedVersion);
        } else {
          writePromise = this.supabaseAdmin.from("vetan_erp_store").upsert(
            { id: "live", payload: this.data, updated_at: newUpdatedAt },
            { onConflict: "id" }
          );
        }
        const { data: updateResult, error } = await Promise.race([writePromise, timeoutPromise]);
        if (error) {
          const msg = error.message || String(error);
          console.error(`[Supabase] persist attempt ${attempt}/${maxRetries} FAILED:`, msg);
          if (attempt < maxRetries) {
            await new Promise((r) => setTimeout(r, 1e3 * attempt));
            continue;
          }
          return { ok: false, error: msg };
        }
        if (this._loadedVersion && Array.isArray(updateResult) && updateResult.length === 0) {
          this._conflictCount++;
          console.warn(`[Supabase] OCC CONFLICT #${this._conflictCount} \u2014 another writer updated. Reloading...`);
          await this.reloadFromSupabase();
          if (attempt < maxRetries && this._conflictCount < _PayrollDatabase.MAX_CONFLICT_RETRIES) {
            await new Promise((r) => setTimeout(r, 500 * attempt));
            continue;
          }
          return { ok: false, error: `OCC conflict after ${this._conflictCount} retries`, conflict: true };
        }
        this._loadedVersion = newUpdatedAt;
        this._conflictCount = 0;
        this.lastPersistError = null;
        this.lastPersistSuccess = true;
        this.lastPersistedAt = newUpdatedAt;
        return { ok: true };
      } catch (e) {
        const msg = e?.message || String(e);
        console.error(`[Supabase] persist attempt ${attempt}/${maxRetries} EXCEPTION:`, msg);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 1e3 * attempt));
          continue;
        }
        this.lastPersistError = msg;
        this.lastPersistSuccess = false;
        return { ok: false, error: msg };
      }
    }
    return { ok: false, error: "All retries exhausted" };
  }
  persistData() {
    try {
      const dbPath = import_path.default.join(process.cwd(), "payroll_persisted_store.json");
      import_fs.default.writeFileSync(dbPath, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to persist data to JSON:", e);
    }
    if (this.supabaseAdmin && !this.loadedFromSeed) {
      this._pendingPersist = this._persistToSupabaseWithRetry(3).then((result) => {
        this._pendingPersist = null;
        if (!result.ok) {
          console.error("[Supabase] persistData FAILED after retries:", result.error);
        }
        return result;
      });
    } else if (this.loadedFromSeed && this.supabaseAdmin) {
      console.warn("[Supabase] persistData BLOCKED \u2014 data was loaded from seed, not pushing to prevent data loss.");
    }
  }
  /** Await any pending Supabase write — call at end of API handlers. */
  async flushPendingWrites() {
    if (this._pendingPersist) {
      try {
        await this._pendingPersist;
      } catch {
      }
    }
  }
  /**
   * Synchronous Supabase persist — awaits the write so callers can be sure
   * data is saved before returning the HTTP response.
   */
  async persistDataSync() {
    if (!this.supabaseAdmin) {
      const msg = "Supabase client not available";
      console.error("[Supabase] persistDataSync ABORTED:", msg);
      return { ok: false, error: msg };
    }
    if (this.loadedFromSeed) {
      const msg = "Data loaded from seed \u2014 not pushing";
      console.warn("[Supabase] persistDataSync BLOCKED:", msg);
      return { ok: false, error: msg };
    }
    try {
      const employeeCount = this.data?.employees?.length || 0;
      const payloadSize = JSON.stringify(this.data).length;
      console.log(`[Supabase] persistDataSync START \u2014 ${employeeCount} employees, ${payloadSize} bytes`);
      const result = await this._persistToSupabaseWithRetry(3);
      if (result.ok) {
        this.lastLoadedAt = (/* @__PURE__ */ new Date()).toISOString();
        console.log("[Supabase] persistDataSync SUCCESS \u2014 data saved to vetan_erp_store");
      } else {
        console.error("[Supabase] persistDataSync FAILED:", result.error);
      }
      return result;
    } catch (e) {
      const msg = e?.message || String(e);
      console.error("[Supabase] persistDataSync EXCEPTION:", msg);
      return { ok: false, error: msg };
    }
  }
  async reloadFromSupabase() {
    if (!this.supabaseAdmin) return;
    const MAX_RETRIES = 2;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const TIMEOUT_MS = 1e4;
        const timeoutPromise = new Promise(
          (_, reject) => setTimeout(() => reject(new Error("reloadFromSupabase timeout")), TIMEOUT_MS)
        );
        const queryPromise = this.supabaseAdmin.from("vetan_erp_store").select("payload, updated_at").eq("id", "live").maybeSingle();
        const { data: row, error } = await Promise.race([queryPromise, timeoutPromise]);
        if (error) {
          console.error(`[Supabase] reloadFromSupabase attempt ${attempt} ERROR:`, error.message);
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, 500 * attempt));
            continue;
          }
          return;
        }
        if (!row?.payload || typeof row.payload !== "object") {
          console.warn("[Supabase] reloadFromSupabase \u2014 no payload found");
          return;
        }
        const remoteUpdatedAt = row.updated_at || "";
        if (this.lastPersistedAt && remoteUpdatedAt && remoteUpdatedAt <= this.lastPersistedAt) {
          console.log(`[Supabase] reloadFromSupabase SKIPPED \u2014 remote (${remoteUpdatedAt}) <= last persisted (${this.lastPersistedAt})`);
          return;
        }
        if (this.lastLoadedAt && remoteUpdatedAt && remoteUpdatedAt <= this.lastLoadedAt) {
          console.log(`[Supabase] reloadFromSupabase SKIPPED \u2014 remote (${remoteUpdatedAt}) <= last loaded (${this.lastLoadedAt})`);
          return;
        }
        this.data = { ...this.data, ...row.payload };
        this._loadedVersion = remoteUpdatedAt || "";
        this.lastLoadedAt = remoteUpdatedAt || (/* @__PURE__ */ new Date()).toISOString();
        this.inMemoryOnly = true;
        console.log(`[Supabase] reloadFromSupabase OK \u2014 ${this.data.employees?.length || 0} employees, version: ${this._loadedVersion}`);
        return;
      } catch (e) {
        console.error(`[Supabase] reloadFromSupabase attempt ${attempt} EXCEPTION:`, e?.message || e);
        if (attempt < MAX_RETRIES) await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }
  /** Force an awaited upsert to Supabase (for critical writes). */
  async forcePersistToSupabase() {
    if (!this.supabaseAdmin) return { ok: false, error: "No Supabase client" };
    if (this.loadedFromSeed) {
      console.warn("[Supabase] forcePersist BLOCKED \u2014 loadedFromSeed is true.");
      return { ok: false, error: "Loaded from seed" };
    }
    return this._persistToSupabaseWithRetry(3);
  }
  async restoreFullBackupJSON(backupData) {
    this.data = { ...this.data, ...backupData };
    const runSql = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        this.dbSqlite.run(sql, params, (err) => {
          if (err) {
            console.error("[restoreFullBackupJSON] SQL Error:", err, "SQL Statement:", sql);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    };
    const tablesToClear = [
      "employees",
      "attendance",
      "payroll_runs",
      "payslips",
      "leave_applications",
      "ff_settlements",
      "loans",
      "departments",
      "companies",
      "salary_revisions",
      "assets",
      "travel_reimbursements",
      "broadcasts",
      "attendance_corrections",
      "compoff_requests",
      "overtime_requests",
      "users",
      "hods",
      "audit_logs",
      // Workforce module (Phase A — new tables)
      "contractors",
      "minimum_wage_rates",
      "contractor_bills",
      "contractor_bill_lines",
      "cheque_payments",
      "month_status",
      "attendance_upload_batches"
    ];
    try {
      await runSql("BEGIN TRANSACTION");
      for (const tbl of tablesToClear) {
        await runSql(`DELETE FROM ${tbl}`);
      }
      if (backupData.companies && Array.isArray(backupData.companies)) {
        for (const c of backupData.companies) {
          await runSql(
            `INSERT OR REPLACE INTO companies (id, name, unit_name, logo, registered_office, factory_address, gst_number, pan_number, tan_number, cin_number, pf_number, esic_number, pt_number, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [c.id, c.name, c.unit_name, c.logo, c.registered_office, c.factory_address, c.gst_number, c.pan_number, c.tan_number, c.cin_number, c.pf_number, c.esic_number, c.pt_number, c.settings ? typeof c.settings === "string" ? c.settings : JSON.stringify(c.settings) : null]
          );
        }
      }
      if (backupData.departments && Array.isArray(backupData.departments)) {
        for (const d of backupData.departments) {
          const deptName = typeof d === "string" ? d : d.name;
          if (deptName) {
            await runSql(`INSERT OR REPLACE INTO departments (name) VALUES (?)`, [deptName]);
          }
        }
      }
      if (backupData.employees && Array.isArray(backupData.employees)) {
        for (const e of backupData.employees) {
          const id = e.id || "";
          const name = e.name || "";
          const company = e.company || "";
          const designation = e.designation || "";
          const department = e.department || "";
          const email = e.email || "";
          const phone = e.phone || "";
          const joining_date = e.joining_date || "";
          const exit_date = e.exit_date || null;
          const status = e.status || "ACTIVE";
          const bank_name = e.bank_name || "";
          const bank_account = e.bank_account || "";
          const ifsc = e.ifsc || "";
          const pan = e.pan || "";
          const uan = e.uan || "";
          const base_salary = e.base_salary !== void 0 ? Number(e.base_salary) : 0;
          const hra = e.hra !== void 0 ? Number(e.hra) : 0;
          const special_allowance = e.special_allowance !== void 0 ? Number(e.special_allowance) : 0;
          const da = e.da !== void 0 ? Number(e.da) : 0;
          const pf_opt_in = e.pf_opt_in ? 1 : 0;
          const esic_opt_in = e.esic_opt_in ? 1 : 0;
          const professional_tax_opt_in = e.professional_tax_opt_in ? 1 : 0;
          const leave_balance_pl = e.leave_balance_pl !== void 0 ? Number(e.leave_balance_pl) : 0;
          const leave_balance_cl = e.leave_balance_cl !== void 0 ? Number(e.leave_balance_cl) : 0;
          const leave_balance_sl = e.leave_balance_sl !== void 0 ? Number(e.leave_balance_sl) : 0;
          const qualification = e.qualification || "";
          const location = e.location || "";
          const vehicle_detail = e.vehicle_detail || "";
          const prev_company_name = e.prev_company_name || "";
          const prev_company_location = e.prev_company_location || "";
          const total_experience = e.total_experience || "";
          const shift_timing = e.shift_timing || "8:00 AM to 5:30 PM";
          const password = e.password || "";
          const birth_year = e.birth_year !== void 0 ? Number(e.birth_year) : null;
          const needs_password_change = e.needs_password_change ? 1 : 0;
          const aadhaar_number = e.aadhaar_number || "";
          const dob = e.dob || "";
          const gender = e.gender || "Male";
          const marital_status = e.marital_status || "Single";
          const emergency_contact = e.emergency_contact || "";
          const blood_group = e.blood_group || "O+";
          const esic_number = e.esic_number || "";
          const cost_center = e.cost_center || "";
          const reporting_manager = e.reporting_manager || "";
          const employee_category = e.employee_category || "Staff";
          const reporting_hod = e.reporting_hod || null;
          const reporting_hod_name = e.reporting_hod_name || null;
          const conveyance_allowance = e.conveyance_allowance !== void 0 ? Number(e.conveyance_allowance) : 0;
          const edu_allowance = e.edu_allowance !== void 0 ? Number(e.edu_allowance) : 0;
          const medical_allowance = e.medical_allowance !== void 0 ? Number(e.medical_allowance) : 0;
          const hidden_salary_heads = e.hidden_salary_heads || "";
          const salary_structure_type = e.salary_structure_type || "FIXED";
          const bonus_payable = e.bonus_payable !== void 0 ? Number(e.bonus_payable) : 0;
          const ctc_salary = e.ctc_salary !== void 0 ? Number(e.ctc_salary) : 0;
          const reporting_hod_code = e.reporting_hod_code || e.reporting_hod || "";
          const is_hod = e.is_hod ? 1 : 0;
          const can_approve_leave = e.can_approve_leave ? 1 : 0;
          const can_approve_misspunch = e.can_approve_misspunch || e.can_approve_miss_punch ? 1 : 0;
          const photo = e.photo || "";
          await runSql(
            `INSERT OR REPLACE INTO employees (
            id, name, company, designation, department, email, phone, joining_date, exit_date, status,
            bank_name, bank_account, ifsc, pan, uan, base_salary, hra, special_allowance, da,
            pf_opt_in, esic_opt_in, professional_tax_opt_in, leave_balance_pl, leave_balance_cl, leave_balance_sl,
            qualification, location, vehicle_detail, prev_company_name, prev_company_location, total_experience,
            shift_timing, password, birth_year, needs_password_change, aadhaar_number, dob, gender,
            marital_status, emergency_contact, blood_group, esic_number, cost_center, reporting_manager,
            employee_category, reporting_hod, reporting_hod_name, conveyance_allowance, edu_allowance,
            medical_allowance, hidden_salary_heads, salary_structure_type, bonus_payable, ctc_salary,
            reporting_hod_code, is_hod, can_approve_leave, can_approve_misspunch, photo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              name,
              company,
              designation,
              department,
              email,
              phone,
              joining_date,
              exit_date,
              status,
              bank_name,
              bank_account,
              ifsc,
              pan,
              uan,
              base_salary,
              hra,
              special_allowance,
              da,
              pf_opt_in,
              esic_opt_in,
              professional_tax_opt_in,
              leave_balance_pl,
              leave_balance_cl,
              leave_balance_sl,
              qualification,
              location,
              vehicle_detail,
              prev_company_name,
              prev_company_location,
              total_experience,
              shift_timing,
              password,
              birth_year,
              needs_password_change,
              aadhaar_number,
              dob,
              gender,
              marital_status,
              emergency_contact,
              blood_group,
              esic_number,
              cost_center,
              reporting_manager,
              employee_category,
              reporting_hod,
              reporting_hod_name,
              conveyance_allowance,
              edu_allowance,
              medical_allowance,
              hidden_salary_heads,
              salary_structure_type,
              bonus_payable,
              ctc_salary,
              reporting_hod_code,
              is_hod,
              can_approve_leave,
              can_approve_misspunch,
              photo
            ]
          );
        }
      }
      if (backupData.attendance && Array.isArray(backupData.attendance)) {
        for (const a of backupData.attendance) {
          const id = a.id || `ATT-${a.employee_id || ""}-${a.month || ""}`;
          const employee_id = a.employee_id || "";
          const month = a.month || "";
          const total_days = a.total_days !== void 0 ? Number(a.total_days) : 30;
          const working_days = a.working_days !== void 0 ? Number(a.working_days) : 30;
          const lop_days = a.lop_days !== void 0 ? Number(a.lop_days) : 0;
          const overtime_hours = a.overtime_hours !== void 0 ? Number(a.overtime_hours) : 0;
          const present = a.present !== void 0 ? Number(a.present) : null;
          const absent = a.absent !== void 0 ? Number(a.absent) : null;
          const weekly_off = a.weekly_off !== void 0 ? Number(a.weekly_off) : null;
          const paid_holiday = a.paid_holiday !== void 0 ? Number(a.paid_holiday) : null;
          const leave = a.leave !== void 0 ? Number(a.leave) : null;
          const lwp = a.lwp !== void 0 ? Number(a.lwp) : null;
          const ot_hours = a.ot_hours !== void 0 ? Number(a.ot_hours) : a.overtime_hours || 0;
          const is_locked = a.is_locked ? 1 : 0;
          await runSql(
            `INSERT OR REPLACE INTO attendance (
            id, employee_id, month, total_days, working_days, lop_days, overtime_hours,
            present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, employee_id, month, total_days, working_days, lop_days, overtime_hours, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked]
          );
        }
      }
      if (backupData.payroll_runs && Array.isArray(backupData.payroll_runs)) {
        for (const r of backupData.payroll_runs) {
          const id = r.id || "";
          const month = r.month || "";
          const status = r.status || "";
          const processed_at = r.processed_at || "";
          const total_employees = r.total_employees !== void 0 ? Number(r.total_employees) : 0;
          const total_gross = r.total_gross !== void 0 ? Number(r.total_gross) : r.total_gross_salary !== void 0 ? Number(r.total_gross_salary) : 0;
          const total_deductions = r.total_deductions !== void 0 ? Number(r.total_deductions) : 0;
          const total_net = r.total_net !== void 0 ? Number(r.total_net) : r.total_net_payout !== void 0 ? Number(r.total_net_payout) : 0;
          await runSql(
            `INSERT OR REPLACE INTO payroll_runs (id, month, status, processed_at, total_employees, total_gross, total_deductions, total_net) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, month, status, processed_at, total_employees, total_gross, total_deductions, total_net]
          );
        }
      }
      if (backupData.payslips && Array.isArray(backupData.payslips)) {
        for (const p of backupData.payslips) {
          const id = p.id || "";
          const employee_id = p.employee_id || "";
          const employee_name = p.employee_name || "";
          const designation = p.designation || "";
          const department = p.department || "";
          const pan = p.pan || "";
          const uan = p.uan || "";
          const bank_name = p.bank_name || "";
          const bank_account = p.bank_account || "";
          const ifsc = p.ifsc || "";
          const month = p.month || "";
          const rate_base_salary = p.rate_base_salary !== void 0 ? Number(p.rate_base_salary) : p.base_salary !== void 0 ? Number(p.base_salary) : 0;
          const rate_hra = p.rate_hra !== void 0 ? Number(p.rate_hra) : p.hra !== void 0 ? Number(p.hra) : 0;
          const rate_special_allowance = p.rate_special_allowance !== void 0 ? Number(p.rate_special_allowance) : p.special_allowance !== void 0 ? Number(p.special_allowance) : 0;
          const rate_da = p.rate_da !== void 0 ? Number(p.rate_da) : p.da !== void 0 ? Number(p.da) : 0;
          const rate_edu_allowance = p.rate_edu_allowance !== void 0 ? Number(p.rate_edu_allowance) : Number(p.edu_allowance || 0);
          const rate_medical_allowance = p.rate_medical_allowance !== void 0 ? Number(p.rate_medical_allowance) : Number(p.medical_allowance || 0);
          const rate_conveyance_allowance = p.rate_conveyance_allowance !== void 0 ? Number(p.rate_conveyance_allowance) : Number(p.conveyance_allowance || 0);
          const earned_base_salary = p.earned_base_salary !== void 0 ? Number(p.earned_base_salary) : Number(rate_base_salary);
          const earned_hra = p.earned_hra !== void 0 ? Number(p.earned_hra) : Number(rate_hra);
          const earned_special_allowance = p.earned_special_allowance !== void 0 ? Number(p.earned_special_allowance) : Number(rate_special_allowance);
          const earned_da = p.earned_da !== void 0 ? Number(p.earned_da) : Number(rate_da);
          const earned_edu_allowance = p.earned_edu_allowance !== void 0 ? Number(p.earned_edu_allowance) : Number(rate_edu_allowance);
          const earned_medical_allowance = p.earned_medical_allowance !== void 0 ? Number(p.earned_medical_allowance) : Number(rate_medical_allowance);
          const earned_conveyance_allowance = p.earned_conveyance_allowance !== void 0 ? Number(p.earned_conveyance_allowance) : Number(rate_conveyance_allowance);
          const overtime_pay = p.overtime_pay !== void 0 ? Number(p.overtime_pay) : 0;
          const lop_deduction = p.lop_deduction !== void 0 ? Number(p.lop_deduction) : p.lwp_deduction !== void 0 ? Number(p.lwp_deduction) : 0;
          const pf_deduction = p.pf_deduction !== void 0 ? Number(p.pf_deduction) : 0;
          const esic_deduction = p.esic_deduction !== void 0 ? Number(p.esic_deduction) : 0;
          const professional_tax = p.professional_tax !== void 0 ? Number(p.professional_tax) : p.pt_deduction !== void 0 ? Number(p.pt_deduction) : 0;
          const tds = p.tds !== void 0 ? Number(p.tds) : 0;
          const custom_deductions = p.custom_deductions !== void 0 ? Number(p.custom_deductions) : 0;
          const loan_deduction = p.loan_deduction !== void 0 ? Number(p.loan_deduction) : 0;
          const gross_salary = p.gross_salary !== void 0 ? Number(p.gross_salary) : p.gross_earnings !== void 0 ? Number(p.gross_earnings) : 0;
          const total_deductions = p.total_deductions !== void 0 ? Number(p.total_deductions) : 0;
          const net_salary = p.net_salary !== void 0 ? Number(p.net_salary) : 0;
          const employer_pf = p.employer_pf !== void 0 ? Number(p.employer_pf) : 0;
          const employer_esic = p.employer_esic !== void 0 ? Number(p.employer_esic) : 0;
          const payment_status = p.payment_status || "PENDING";
          const payment_date = p.payment_date || null;
          const hidden_salary_heads = p.hidden_salary_heads || "";
          const salary_structure_type = p.salary_structure_type || "FIXED";
          await runSql(
            `INSERT OR REPLACE INTO payslips (
            id, employee_id, employee_name, designation, department, pan, uan, bank_name, bank_account, ifsc, month,
            rate_base_salary, rate_hra, rate_special_allowance, rate_da, rate_edu_allowance, rate_medical_allowance, rate_conveyance_allowance,
            earned_base_salary, earned_hra, earned_special_allowance, earned_da, earned_edu_allowance, earned_medical_allowance, earned_conveyance_allowance,
            overtime_pay, lop_deduction, pf_deduction, esic_deduction, professional_tax, tds, custom_deductions, loan_deduction,
            gross_salary, total_deductions, net_salary, employer_pf, employer_esic, payment_status, payment_date, hidden_salary_heads, salary_structure_type,
            pay_days, calendar_days, salary_advance
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              employee_id,
              employee_name,
              designation,
              department,
              pan,
              uan,
              bank_name,
              bank_account,
              ifsc,
              month,
              rate_base_salary,
              rate_hra,
              rate_special_allowance,
              rate_da,
              rate_edu_allowance,
              rate_medical_allowance,
              rate_conveyance_allowance,
              earned_base_salary,
              earned_hra,
              earned_special_allowance,
              earned_da,
              earned_edu_allowance,
              earned_medical_allowance,
              earned_conveyance_allowance,
              overtime_pay,
              lop_deduction,
              pf_deduction,
              esic_deduction,
              professional_tax,
              tds,
              custom_deductions,
              loan_deduction,
              gross_salary,
              total_deductions,
              net_salary,
              employer_pf,
              employer_esic,
              payment_status,
              payment_date,
              hidden_salary_heads,
              salary_structure_type,
              p.pay_days || 0,
              p.calendar_days || 30,
              p.salary_advance || 0
            ]
          );
        }
      }
      if (backupData.leave_applications && Array.isArray(backupData.leave_applications)) {
        for (const l of backupData.leave_applications) {
          await runSql(
            `INSERT OR REPLACE INTO leave_applications (id, employee_id, employee_name, company, leave_type, start_date, end_date, days, reason, applied_date, status, reporting_hod, reporting_hod_name, hod_approved_date, hr_approved_date, hod_id, hr_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              l.id,
              l.employee_id,
              l.employee_name,
              l.company,
              l.leave_type,
              l.start_date,
              l.end_date,
              l.days,
              l.reason,
              l.applied_date,
              l.status,
              l.reporting_hod || null,
              l.reporting_hod_name || null,
              l.hod_approved_date || null,
              l.hr_approved_date || null,
              l.hod_id || null,
              l.hr_id || null
            ]
          );
        }
      }
      if (backupData.ff_settlements && Array.isArray(backupData.ff_settlements)) {
        for (const f of backupData.ff_settlements) {
          await runSql(
            `INSERT OR REPLACE INTO ff_settlements (id, employee_id, employee_name, company, last_working_day, gratuity_earned, earned_leave_encashment, unpaid_salary_days, unpaid_salary_earned, notice_period_deduction, gross_earnings, gross_deductions, net_settlement_pay, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              f.id,
              f.employee_id,
              f.employee_name,
              f.company,
              f.last_working_day,
              f.gratuity_earned,
              f.earned_leave_encashment,
              f.unpaid_salary_days,
              f.unpaid_salary_earned,
              f.notice_period_deduction,
              f.gross_earnings,
              f.gross_deductions,
              f.net_settlement_pay,
              f.status
            ]
          );
        }
      }
      if (backupData.loans && Array.isArray(backupData.loans)) {
        for (const lo of backupData.loans) {
          const id = lo.id || "";
          const employee_id = lo.employee_id || "";
          const employee_name = lo.employee_name || "";
          const amount = lo.amount !== void 0 ? Number(lo.amount) : 0;
          const month = lo.month || "";
          const monthly_deduction = lo.monthly_deduction !== void 0 ? Number(lo.monthly_deduction) : 0;
          const reason = lo.reason || "";
          const status = lo.status || "PENDING";
          await runSql(
            `INSERT OR REPLACE INTO loans (id, employee_id, employee_name, amount, month, monthly_deduction, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, employee_id, employee_name, amount, month, monthly_deduction, reason, status]
          );
        }
      }
      if (backupData.salary_revisions && Array.isArray(backupData.salary_revisions)) {
        for (const sr of backupData.salary_revisions) {
          const id = sr.id;
          const employee_code = sr.employee_code || sr.employee_id || "";
          const old_salary = sr.old_salary !== void 0 ? Number(sr.old_salary) : 0;
          const new_salary = sr.new_salary !== void 0 ? Number(sr.new_salary) : 0;
          const effective_date = sr.effective_date || "";
          const reason = sr.reason || "";
          const approved_by = sr.approved_by || "";
          const created_at = sr.created_at || sr.approved_date || (/* @__PURE__ */ new Date()).toISOString();
          const remarks = sr.remarks || "";
          const increment_amount = sr.increment_amount !== void 0 ? Number(sr.increment_amount) : new_salary - old_salary;
          const old_structure = typeof sr.old_structure === "object" ? JSON.stringify(sr.old_structure) : sr.old_structure || "";
          const new_structure = typeof sr.new_structure === "object" ? JSON.stringify(sr.new_structure) : sr.new_structure || "";
          await runSql(
            `INSERT OR REPLACE INTO salary_revisions (id, employee_code, old_salary, new_salary, effective_date, reason, approved_by, created_at, remarks, increment_amount, old_structure, new_structure) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, employee_code, old_salary, new_salary, effective_date, reason, approved_by, created_at, remarks, increment_amount, old_structure, new_structure]
          );
        }
      }
      if (backupData.assets && Array.isArray(backupData.assets)) {
        for (const as of backupData.assets) {
          const id = as.id || "";
          const employee_id = as.employee_id || null;
          const employee_name = as.employee_name || null;
          const asset_name = as.asset_name || as.name || "";
          const serial_number = as.serial_number || "";
          const type = as.type || "";
          const issue_date = as.issue_date || as.assigned_date || as.purchase_date || "";
          const return_date = as.return_date || null;
          const status = as.status || "ASSIGNED";
          const condition = as.condition || "";
          await runSql(
            `INSERT OR REPLACE INTO assets (id, employee_id, employee_name, asset_name, serial_number, type, issue_date, return_date, status, condition) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, employee_id, employee_name, asset_name, serial_number, type, issue_date, return_date, status, condition]
          );
        }
      }
      if (backupData.travel_reimbursements && Array.isArray(backupData.travel_reimbursements)) {
        for (const tr of backupData.travel_reimbursements) {
          const id = tr.id || "";
          const employee_id = tr.employee_id || "";
          const employee_name = tr.employee_name || "";
          const month = tr.month || "";
          const fuel_liters = tr.fuel_liters !== void 0 ? Number(tr.fuel_liters) : 0;
          const rate_per_liter = tr.rate_per_liter !== void 0 ? Number(tr.rate_per_liter) : 0;
          const amount = tr.amount !== void 0 ? Number(tr.amount) : tr.total_amount !== void 0 ? Number(tr.total_amount) : 0;
          const travel_purpose = tr.travel_purpose || tr.purpose || "";
          const status = tr.status || "PENDING";
          await runSql(
            `INSERT OR REPLACE INTO travel_reimbursements (id, employee_id, employee_name, month, fuel_liters, rate_per_liter, amount, travel_purpose, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, employee_id, employee_name, month, fuel_liters, rate_per_liter, amount, travel_purpose, status]
          );
        }
      }
      if (backupData.broadcasts && Array.isArray(backupData.broadcasts)) {
        for (const br of backupData.broadcasts) {
          const id = br.id || "";
          const title = br.title || "";
          const message = br.message || "";
          const created_by = br.created_by || "";
          const created_at = br.created_at || "";
          await runSql(
            `INSERT OR REPLACE INTO broadcasts (id, title, message, created_by, created_at) VALUES (?, ?, ?, ?, ?)`,
            [id, title, message, created_by, created_at]
          );
        }
      }
      if (backupData.attendance_corrections && Array.isArray(backupData.attendance_corrections)) {
        for (const ac of backupData.attendance_corrections) {
          await runSql(
            `INSERT OR REPLACE INTO attendance_corrections (id, employee_id, employee_name, company, date, original_status, requested_status, reason, applied_date, reporting_hod, reporting_hod_name, status, escalated_reminder_sent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ac.id, ac.employee_id, ac.employee_name, ac.company, ac.date, ac.original_status, ac.requested_status, ac.reason, ac.applied_date, ac.reporting_hod || null, ac.reporting_hod_name || null, ac.status, ac.escalated_reminder_sent ? 1 : 0]
          );
        }
      }
      if (backupData.compoff_requests && Array.isArray(backupData.compoff_requests)) {
        for (const co of backupData.compoff_requests) {
          await runSql(
            `INSERT OR REPLACE INTO compoff_requests (id, employee_id, employee_name, company, date, reason, applied_date, status, reporting_hod, reporting_hod_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [co.id, co.employee_id, co.employee_name, co.company, co.date, co.reason, co.applied_date, co.status, co.reporting_hod || null, co.reporting_hod_name || null]
          );
        }
      }
      if (backupData.overtime_requests && Array.isArray(backupData.overtime_requests)) {
        for (const ov of backupData.overtime_requests) {
          await runSql(
            `INSERT OR REPLACE INTO overtime_requests (id, employee_id, employee_name, company, date, hours, reason, applied_date, status, reporting_hod, reporting_hod_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [ov.id, ov.employee_id, ov.employee_name, ov.company, ov.date, ov.hours, ov.reason, ov.applied_date, ov.status, ov.reporting_hod || null, ov.reporting_hod_name || null]
          );
        }
      }
      if (backupData.users && Array.isArray(backupData.users)) {
        for (const u of backupData.users) {
          const username = u.username || "";
          const password_hash = u.password_hash || "";
          const name = u.name || "";
          const role = u.role || "";
          const email = u.email || "";
          const phone = u.phone || "";
          const company = u.company || "";
          const status = u.status || "ACTIVE";
          const company_rights = typeof u.company_rights === "string" ? u.company_rights : JSON.stringify(u.company_rights || u.allowed_units || []);
          await runSql(
            `INSERT OR REPLACE INTO users (username, password_hash, name, role, email, phone, company, status, company_rights) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, password_hash, name, role, email, phone, company, status, company_rights]
          );
        }
      }
      if (backupData.hods && Array.isArray(backupData.hods)) {
        for (const h of backupData.hods) {
          const id = h.id || "";
          const name = h.name || "";
          const department = h.department || "";
          const email = h.email || "";
          const phone = h.phone || "";
          const active = h.active !== void 0 ? h.active ? 1 : 0 : h.is_active ? 1 : 0;
          const company_rights = typeof h.company_rights === "string" ? h.company_rights : JSON.stringify(h.company_rights || h.allowed_companies || []);
          await runSql(
            `INSERT OR REPLACE INTO hods (id, name, department, email, phone, active, company_rights) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, name, department, email, phone, active, company_rights]
          );
        }
      }
      if (backupData.audit_logs && Array.isArray(backupData.audit_logs)) {
        for (const al of backupData.audit_logs) {
          const id = al.id || "AUDIT-" + Math.random().toString(36).substring(2, 11).toUpperCase();
          const action = al.action || "";
          const details = al.details || "";
          const user_name = al.user_name || al.operator || "Admin";
          const timestamp = al.timestamp || (/* @__PURE__ */ new Date()).toISOString();
          await runSql(
            `INSERT OR REPLACE INTO audit_logs (id, action, details, user_name, timestamp) VALUES (?, ?, ?, ?, ?)`,
            [id, action, details, user_name, timestamp]
          );
        }
      }
      const workforceTables = ["contractors", "minimum_wage_rates", "contractor_bills", "contractor_bill_lines", "cheque_payments", "month_status", "attendance_upload_batches"];
      for (const tbl of workforceTables) {
        const rows = backupData[tbl];
        if (Array.isArray(rows)) {
          for (const row of rows) {
            const cols = Object.keys(row);
            if (cols.length === 0) continue;
            const placeholders = cols.map(() => "?").join(",");
            await runSql(`INSERT OR REPLACE INTO ${tbl} (${cols.join(",")}) VALUES (${placeholders})`, cols.map((c) => row[c] ?? null));
          }
        }
      }
      await runSql("COMMIT");
    } catch (error) {
      try {
        await runSql("ROLLBACK");
      } catch (rollbackErr) {
        console.error("[restoreFullBackupJSON] Rollback failed:", rollbackErr);
      }
      throw error;
    }
    await this.loadAllFromSQLite();
    this.persistData();
  }
  async purgeEmployees() {
    const runSql = (query, params = []) => {
      return new Promise((resolve, reject) => {
        this.dbSqlite.run(query, params, (err) => err ? reject(err) : resolve());
      });
    };
    await runSql(`DELETE FROM employees`);
    await runSql(`DELETE FROM attendance`);
    await runSql(`DELETE FROM leave_applications`);
    await runSql(`DELETE FROM payroll_runs`);
    await runSql(`DELETE FROM payslips`);
    await runSql(`DELETE FROM loans`);
    await runSql(`DELETE FROM salary_revisions`);
    await runSql(`DELETE FROM assets`);
    await runSql(`DELETE FROM travel_reimbursements`);
    await runSql(`DELETE FROM attendance_corrections`);
    await runSql(`DELETE FROM compoff_requests`);
    await runSql(`DELETE FROM overtime_requests`);
    await runSql(`DELETE FROM ff_settlements`);
    await runSql(`INSERT OR REPLACE INTO system_settings (key, value) VALUES ('database_seeded', '1')`);
    await this.loadAllFromSQLite();
  }
  // Comp-off Ledger Operations
  getCompOffLedger() {
    if (!this.data.compoff_ledger) this.data.compoff_ledger = [];
    return this.data.compoff_ledger;
  }
  addCompOffLedgerEntry(entry) {
    if (!this.data.compoff_ledger) this.data.compoff_ledger = [];
    const id = entry.id || `COL${Date.now()}`;
    const earnedDays = Number(entry.earned_days || 0);
    const availedDays = Number(entry.availed_days || 0);
    const newEntry = {
      id,
      employee_id: entry.employee_id,
      employee_name: entry.employee_name,
      company: entry.company,
      date_earned: entry.date_earned,
      reason: entry.reason,
      earned_days: earnedDays,
      availed_days: availedDays,
      balance: Number(entry.balance ?? earnedDays - availedDays),
      expiry_date: entry.expiry_date
    };
    this.data.compoff_ledger.push(newEntry);
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO compoff_ledger (id, employee_id, employee_name, company, date_earned, reason, earned_days, availed_days, balance, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newEntry.id, newEntry.employee_id, newEntry.employee_name, newEntry.company, newEntry.date_earned, newEntry.reason, newEntry.earned_days, newEntry.availed_days, newEntry.balance, newEntry.expiry_date]
    );
    if (entry.employee_id) {
      const emp = this.data.employees.find((e) => e.id === entry.employee_id);
      if (emp) {
        const netChange = earnedDays - availedDays;
        emp.leave_balance_compoff = Number(emp.leave_balance_compoff || 0) + netChange;
        if (emp.leave_balance_compoff < 0) emp.leave_balance_compoff = 0;
        if (this.dbSqlite && typeof this.dbSqlite.run === "function") {
          this.dbSqlite.run(`UPDATE employees SET leave_balance_compoff = ? WHERE id = ?`, [emp.leave_balance_compoff, emp.id]);
        }
        console.log(`[CompOff] ${emp.name}: +${earnedDays} earned, -${availedDays} availed \u2192 balance: ${emp.leave_balance_compoff}`);
      }
    }
    this.persistData();
    return newEntry;
  }
  // HR Policy & Employee Handbook Operations
  getPolicies() {
    if (!this.data.policies) this.data.policies = [];
    return this.data.policies;
  }
  addPolicy(policy) {
    if (!this.data.policies) this.data.policies = [];
    const id = policy.id || `POL${Date.now()}`;
    const newPolicy = {
      id,
      name: policy.name,
      content: policy.content || "",
      pdf_url: policy.pdf_url || "",
      version: policy.version || "1.0",
      is_archived: policy.is_archived ? 1 : 0,
      created_at: policy.created_at || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      updated_at: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    const idx = this.data.policies.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.data.policies[idx] = newPolicy;
    } else {
      this.data.policies.push(newPolicy);
    }
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO policies (id, name, content, pdf_url, version, is_archived, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newPolicy.id, newPolicy.name, newPolicy.content, newPolicy.pdf_url, newPolicy.version, newPolicy.is_archived, newPolicy.created_at, newPolicy.updated_at]
    );
    return newPolicy;
  }
  // Policy Acknowledgements
  getPolicyAcknowledgements() {
    if (!this.data.policy_acknowledgements) this.data.policy_acknowledgements = [];
    return this.data.policy_acknowledgements;
  }
  addPolicyAcknowledgement(ack) {
    if (!this.data.policy_acknowledgements) this.data.policy_acknowledgements = [];
    const id = ack.id || `ACK${Date.now()}`;
    const newAck = {
      id,
      employee_id: ack.employee_id,
      policy_name: ack.policy_name,
      read_date: ack.read_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      acknowledgement_date: ack.acknowledgement_date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      version: ack.version || "1.0"
    };
    const idx = this.data.policy_acknowledgements.findIndex((a) => a.employee_id === ack.employee_id && a.policy_name === ack.policy_name && a.version === ack.version);
    if (idx !== -1) {
      this.data.policy_acknowledgements[idx] = newAck;
    } else {
      this.data.policy_acknowledgements.push(newAck);
    }
    this.dbSqlite.run(
      `INSERT OR REPLACE INTO policy_acknowledgements (id, employee_id, policy_name, read_date, acknowledgement_date, version) VALUES (?, ?, ?, ?, ?, ?)`,
      [newAck.id, newAck.employee_id, newAck.policy_name, newAck.read_date, newAck.acknowledgement_date, newAck.version]
    );
    return newAck;
  }
  // Gate Passes Operations
  getGatePasses() {
    if (!this.data.gate_passes) this.data.gate_passes = [];
    return this.data.gate_passes;
  }
  addGatePass(pass) {
    if (!this.data.gate_passes) this.data.gate_passes = [];
    const nextNum = Math.max(...(this.data.gate_passes || []).map((g) => {
      const numericPart = g.id ? parseInt(g.id.replace("GP", "")) : 0;
      return isNaN(numericPart) ? 0 : numericPart;
    }), 0) + 1;
    const id = `GP${String(nextNum).padStart(3, "0")}`;
    const newPass = {
      id,
      employee_id: pass.employee_id,
      employee_name: pass.employee_name,
      company: pass.company,
      target_company: pass.target_company,
      purpose: pass.purpose,
      applied_date: pass.applied_date || (/* @__PURE__ */ new Date()).toISOString(),
      status: pass.status || "PENDING_HOD",
      reporting_hod: pass.reporting_hod || null,
      reporting_hod_name: pass.reporting_hod_name || null,
      departure_time: pass.departure_time || null,
      arrival_time: pass.arrival_time || null,
      return_departure_time: pass.return_departure_time || null,
      return_arrival_time: pass.return_arrival_time || null,
      out_gate_security_id: pass.out_gate_security_id || null,
      in_gate_security_id: pass.in_gate_security_id || null,
      return_out_gate_security_id: pass.return_out_gate_security_id || null,
      return_in_gate_security_id: pass.return_in_gate_security_id || null,
      destination_type: pass.destination_type || "INTERNAL",
      vendor_location: pass.vendor_location || null
    };
    this.data.gate_passes.push(newPass);
    this.dbSqlite.run(
      `INSERT INTO gate_passes (id, employee_id, employee_name, company, target_company, purpose, applied_date, status, reporting_hod, reporting_hod_name, departure_time, arrival_time, return_departure_time, return_arrival_time, out_gate_security_id, in_gate_security_id, return_out_gate_security_id, return_in_gate_security_id, destination_type, vendor_location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newPass.id,
        newPass.employee_id,
        newPass.employee_name,
        newPass.company,
        newPass.target_company,
        newPass.purpose,
        newPass.applied_date,
        newPass.status,
        newPass.reporting_hod,
        newPass.reporting_hod_name,
        newPass.departure_time,
        newPass.arrival_time,
        newPass.return_departure_time,
        newPass.return_arrival_time,
        newPass.out_gate_security_id,
        newPass.in_gate_security_id,
        newPass.return_out_gate_security_id,
        newPass.return_in_gate_security_id,
        newPass.destination_type,
        newPass.vendor_location
      ]
    );
    return newPass;
  }
  updateGatePassStatus(id, status, details) {
    if (!this.data.gate_passes) this.data.gate_passes = [];
    const idx = this.data.gate_passes.findIndex((g) => g.id === id);
    if (idx === -1) return false;
    const pass = this.data.gate_passes[idx];
    pass.status = status;
    if (details) {
      if (details.departure_time !== void 0) pass.departure_time = details.departure_time;
      if (details.arrival_time !== void 0) pass.arrival_time = details.arrival_time;
      if (details.return_departure_time !== void 0) pass.return_departure_time = details.return_departure_time;
      if (details.return_arrival_time !== void 0) pass.return_arrival_time = details.return_arrival_time;
      if (details.out_gate_security_id !== void 0) pass.out_gate_security_id = details.out_gate_security_id;
      if (details.in_gate_security_id !== void 0) pass.in_gate_security_id = details.in_gate_security_id;
      if (details.return_out_gate_security_id !== void 0) pass.return_out_gate_security_id = details.return_out_gate_security_id;
      if (details.return_in_gate_security_id !== void 0) pass.return_in_gate_security_id = details.return_in_gate_security_id;
    }
    this.dbSqlite.run(
      `UPDATE gate_passes SET status = ?, departure_time = ?, arrival_time = ?, return_departure_time = ?, return_arrival_time = ?, out_gate_security_id = ?, in_gate_security_id = ?, return_out_gate_security_id = ?, return_in_gate_security_id = ? WHERE id = ?`,
      [
        pass.status,
        pass.departure_time,
        pass.arrival_time,
        pass.return_departure_time,
        pass.return_arrival_time,
        pass.out_gate_security_id,
        pass.in_gate_security_id,
        pass.return_out_gate_security_id,
        pass.return_in_gate_security_id,
        id
      ]
    );
    return true;
  }
};

// server/app.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var _dbRef = null;
function getAppDb() {
  return _dbRef;
}
async function createApp(supabaseAdmin) {
  const app = (0, import_express.default)();
  const db = new PayrollDatabase(supabaseAdmin);
  _dbRef = db;
  let startupException = null;
  try {
    console.log("Starting payroll database initialization...");
    await db.init();
    console.log("Payroll database initialized successfully.");
  } catch (err) {
    startupException = err;
    console.error("CRITICAL: Failed to initialize payroll database during server start:", err);
  }
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
  app.use((req, res, next) => {
    if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);
      const flushAndSend = async (sendFn, body) => {
        try {
          if (db && typeof db.flushPendingWrites === "function") {
            await db.flushPendingWrites();
          }
        } catch (e) {
          console.error("[FlushMiddleware] flushPendingWrites failed:", e?.message);
        }
        if (db && db.lastPersistError && typeof body === "object" && body !== null) {
          body.persistWarning = "Cloud save may have failed. Verify your data.";
        }
        return sendFn(body);
      };
      res.json = function(body) {
        (async () => {
          try {
            if (db && typeof db.flushPendingWrites === "function") {
              await db.flushPendingWrites();
            }
          } catch (e) {
            console.error("[FlushMiddleware] flushPendingWrites failed:", e?.message);
          }
          if (db && db.lastPersistError && typeof body === "object" && body !== null) {
            body.persistWarning = "Cloud save may have failed. Verify your data.";
          }
          originalJson(body);
        })();
        return res;
      };
    }
    next();
  });
  app.use((req, res, next) => {
    const role = req.headers["x-operator-role"] || "";
    const method = req.method;
    if (role === "AUDITOR" && ["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const isLoginRoute = req.path === "/api/hr/login" || req.path === "/api/employee/login";
      if (!isLoginRoute) {
        return res.status(403).json({ success: false, error: "Access Denied: Auditors are in read-only view mode and cannot modify any database records." });
      }
    }
    next();
  });
  async function verifyPin(pin) {
    const isSecEnabled = await db.getSystemSetting("production_security_enabled", "0");
    const securityMode = await db.getSystemSetting("security_mode", "testing");
    if (isSecEnabled === "0" && securityMode !== "production") {
      return true;
    }
    const hash = import_crypto2.default.createHash("sha256").update(String(pin || "")).digest("hex");
    const storedHash = await db.getSystemSetting("super_admin_pin", import_crypto2.default.createHash("sha256").update("1234").digest("hex"));
    return hash === storedHash;
  }
  function getCompanyBrand(companyIdOrName) {
    const name = String(companyIdOrName || "").toUpperCase();
    if (name.includes("SVN")) return "SVN";
    if (name.includes("SAKAR")) return "Sakar";
    if (name.includes("FLARE")) return "Flare";
    if (name.includes("ZENIVO")) return "Zenivo";
    return companyIdOrName;
  }
  function getAllowedCompanies(req) {
    const username = (req.headers["x-operator-username"] || "").trim().toLowerCase();
    const role = req.headers["x-operator-role"] || "";
    const empId = req.headers["x-employee-id"] || "";
    if (username) {
      try {
        const users = db.getUsers();
        const user = users.find((u) => u.username.toLowerCase() === username);
        if (user) {
          if (user.role === "SUPER_HR" || user.role === "MANAGEMENT" || user.role === "AUDITOR" || user.username === "group_director") {
            return null;
          }
          return user.company_rights || [];
        }
      } catch (e) {
        console.error("Error fetching users in getAllowedCompanies:", e);
      }
    }
    if (role === "SUPER_HR" || role === "MANAGEMENT" || role === "AUDITOR" || username === "group_director") {
      return null;
    }
    let brand = null;
    if (username === "svn_specialist" || username === "svn_attendance_operator") {
      brand = "SVN";
    } else if (username === "sakar_specialist") {
      brand = "Sakar";
    } else if (empId) {
      const employees = db.getEmployees();
      const emp = employees.find((e) => e.id.toLowerCase() === empId.toLowerCase());
      if (emp) {
        brand = getCompanyBrand(emp.company);
      }
    }
    if (brand) {
      const allCompanies = db.getCompanies();
      return allCompanies.filter((c) => getCompanyBrand(c.id) === brand).map((c) => c.id);
    }
    if (!username && !empId && !role) {
      return null;
    }
    return [];
  }
  app.get("/api/db-status", (req, res) => {
    const isMock = db.inMemoryOnly;
    const employeeCount = db.data?.employees?.length || 0;
    const hasSupabase = !!db.supabaseAdmin;
    const loadedFromSeed = !!db.loadedFromSeed;
    let dbMode = "SQLite3-File";
    if (hasSupabase && employeeCount > 0) dbMode = "Supabase-Cloud";
    else if (isMock) dbMode = "InMemoryFallback";
    const warnings = [];
    if (startupException) warnings.push(startupException.message || String(startupException));
    else if (isMock && !hasSupabase) warnings.push("sqlite3 package failed to load or open file. Falling back to Pure JS In-Memory Mode.");
    res.json({
      status: startupException ? "ERROR" : "OK",
      currentDatabaseMode: dbMode,
      isPayrollDbActive: !startupException && employeeCount > 0,
      isInMemoryMode: isMock,
      employeeCount,
      hasSupabaseClient: hasSupabase,
      loadedFromSeed,
      initializationWarnings: warnings
    });
  });
  app.get("/api/dashboard/summary", (req, res) => {
    const { company } = req.query;
    const allowed = getAllowedCompanies(req);
    let targetCompany = company;
    if (allowed) {
      if (company && company !== "ALL") {
        if (!allowed.includes(company)) {
          return res.status(403).json({ error: "Unauthorized company access" });
        }
      }
    }
    const employees = db.getEmployees(targetCompany).filter((e) => {
      if (allowed) return allowed.includes(e.company);
      return true;
    });
    let runs = db.getPayrollRuns();
    if (targetCompany && targetCompany !== "ALL" && targetCompany !== "GROUP" && targetCompany !== "COMBINED") {
      runs = runs.filter((r) => r.id.endsWith(`-${targetCompany}`));
    } else if (allowed) {
      runs = runs.filter((r) => allowed.some((comp) => r.id.endsWith(`-${comp}`)) || r.id === `RUN-${r.month}`);
    }
    const closedRuns = runs.filter((r) => r.status === "CLOSED");
    const latestClosed = closedRuns.length > 0 ? closedRuns.sort((a, b) => b.month.localeCompare(a.month))[0] : void 0;
    const draftRuns = runs.filter((r) => r.status === "DRAFT");
    res.json({
      totalEmployees: employees.length,
      runsProcessed: runs.length,
      latestClosed,
      currentDraft: draftRuns[0] || null,
      departmentBreakdown: employees.reduce((acc, emp) => {
        acc[emp.department] = (acc[emp.department] || 0) + 1;
        return acc;
      }, {})
    });
  });
  app.get("/api/departments", (req, res) => {
    try {
      res.json(db.getDepartments());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/departments", (req, res) => {
    try {
      const { department } = req.body;
      if (!department || typeof department !== "string") {
        return res.status(400).json({ error: "Department name is required" });
      }
      const list = db.addDepartment(department);
      res.json({ success: true, departments: list });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/companies", (req, res) => {
    try {
      const allowed = getAllowedCompanies(req);
      let list = db.getCompanies();
      if (allowed) {
        list = list.filter((c) => allowed.includes(c.id));
      }
      res.json(list);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/companies", async (req, res) => {
    try {
      const operatorRole = getOperatorRole(req);
      if (operatorRole !== "SUPER_HR") {
        return res.status(403).json({ error: "Access Denied: Only Super Admin can register new companies." });
      }
      const { pin, ...newCompany } = req.body;
      if (!await verifyPin(pin)) {
        return res.status(403).json({ error: "PIN_INVALID", message: "Invalid or missing Super Admin Security PIN." });
      }
      if (!newCompany.id || !newCompany.name) {
        return res.status(400).json({ error: "Company Code and Company Name are required." });
      }
      const created = db.addCompany(newCompany);
      res.json({ success: true, company: created });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.put("/api/companies/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { pin, ...updateData } = req.body;
      if (!await verifyPin(pin)) {
        return res.status(403).json({ error: "PIN_INVALID", message: "Invalid or missing Super Admin Security PIN." });
      }
      const updated = db.updateCompany(id, updateData);
      if (!updated) {
        return res.status(404).json({ error: "Company not found" });
      }
      res.json({ success: true, company: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/revisions", (req, res) => {
    try {
      const { employee_code } = req.query;
      res.json(db.getSalaryRevisions(employee_code));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/revisions", (req, res) => {
    try {
      const { action } = req.body;
      console.log("[REVISIONS] action=", action, "body_keys=", Object.keys(req.body || {}));
      if (action === "delete_revision") {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: "Revision ID required" });
        db.deleteSalaryRevision(id);
        db.logAudit("Revision Deleted", `Salary revision ${id} deleted`, getOperator(req));
        return res.json({ success: true });
      }
      if (action === "update_revision") {
        const { id, old_salary: old_salary2, new_salary: new_salary2, effective_date: effective_date2, reason: reason2, remarks: remarks2 } = req.body;
        if (!id) return res.status(400).json({ error: "Revision ID required" });
        db.updateSalaryRevision(id, { old_salary: old_salary2, new_salary: new_salary2, effective_date: effective_date2, reason: reason2, remarks: remarks2 });
        db.logAudit("Revision Updated", `Salary revision ${id} updated`, getOperator(req));
        return res.json({ success: true });
      }
      const {
        employee_code,
        old_salary,
        new_salary,
        effective_date,
        reason,
        approved_by,
        hra,
        conveyance_allowance,
        edu_allowance,
        medical_allowance,
        special_allowance,
        da,
        remarks,
        increment_amount,
        old_structure,
        new_structure
      } = req.body;
      if (!employee_code || !new_salary || !effective_date) {
        return res.status(400).json({ error: "Employee code, new salary, and effective date are required" });
      }
      const emp = db.getEmployeeById(employee_code);
      const rev = db.addSalaryRevision({
        employee_code,
        old_salary: Number(old_salary),
        new_salary: Number(new_salary),
        effective_date,
        reason: reason || "",
        approved_by: approved_by || "Admin",
        hra: hra !== void 0 ? Number(hra) : void 0,
        conveyance_allowance: conveyance_allowance !== void 0 ? Number(conveyance_allowance) : void 0,
        edu_allowance: edu_allowance !== void 0 ? Number(edu_allowance) : void 0,
        medical_allowance: medical_allowance !== void 0 ? Number(medical_allowance) : void 0,
        special_allowance: special_allowance !== void 0 ? Number(special_allowance) : void 0,
        da: da !== void 0 ? Number(da) : void 0,
        remarks: remarks || "",
        increment_amount: increment_amount !== void 0 ? Number(increment_amount) : void 0,
        old_structure: typeof old_structure === "object" ? JSON.stringify(old_structure) : old_structure,
        new_structure: typeof new_structure === "object" ? JSON.stringify(new_structure) : new_structure
      });
      db.logAudit("Salary Changed", `Salary structures changed for ${emp?.name || employee_code} to \u20B9${Number(new_salary).toLocaleString("en-IN")}`, getOperator(req));
      res.json({ success: true, revision: rev });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/employees", (req, res) => {
    const { company } = req.query;
    const allowed = getAllowedCompanies(req);
    if (allowed) {
      if (company && company !== "ALL") {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
        return res.json(db.getEmployees(company));
      } else {
        const allEmps = db.getEmployees();
        return res.json(allEmps.filter((e) => allowed.includes(e.company)));
      }
    }
    res.json(db.getEmployees(company));
  });
  app.get("/api/hr/users", (req, res) => {
    try {
      const users = db.getUsers().map(({ password: _pw, ...safe }) => safe);
      res.json(users);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/hr/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const isSecEnabled = await db.getSystemSetting("production_security_enabled", "0") === "1";
      if (!username) {
        return res.status(400).json({ success: false, error: "Username is required" });
      }
      if (isSecEnabled && !password) {
        return res.status(400).json({ success: false, error: "Password is required when production security is enabled." });
      }
      let users = db.getUsers();
      let user = users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
      const defaultUsersMap = {
        "vishnu": {
          id: "USR001",
          username: "vishnu",
          name: "Vishnu Arrawatia",
          role: "SUPER_HR",
          title: "Super Admin",
          company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"],
          password: "Varrawatia",
          disabled: false
        },
        "varrawatia": {
          id: "USR011",
          username: "varrawatia",
          name: "Varrawatia (Admin)",
          role: "SUPER_HR",
          title: "Super Admin",
          company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"],
          password: "Varrawatia",
          disabled: false
        },
        "vijay": {
          id: "USR002",
          username: "vijay",
          name: "Mr. V. K. Saraf (MD)",
          role: "MANAGEMENT",
          title: "Managing Director",
          company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"],
          password: "VKS",
          disabled: false
        },
        "vks": {
          id: "USR012",
          username: "vks",
          name: "VKS (MD)",
          role: "MANAGEMENT",
          title: "Managing Director",
          company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"],
          password: "VKS",
          disabled: false
        },
        "vijendra": {
          id: "USR003",
          username: "vijendra",
          name: "Vijendra",
          role: "COMPANY_HR",
          title: "HR Officer (SVN Unit I)",
          company_rights: ["SVN-1"],
          password: "vijendra",
          disabled: false
        },
        "manisha_s": {
          id: "USR004",
          username: "manisha_s",
          name: "Manisha Sapate",
          role: "COMPANY_HR",
          title: "HR Officer (SVN Unit II)",
          company_rights: ["SVN-II"],
          password: "manisha_s",
          disabled: false
        },
        "manisha": {
          id: "USR005",
          username: "manisha",
          name: "Manisha",
          role: "COMPANY_HR",
          title: "HR Officer (Sakar Unit I)",
          company_rights: ["Sakar-I"],
          password: "manisha",
          disabled: false
        },
        "indraprakash": {
          id: "USR006",
          username: "indraprakash",
          name: "Indraprakash",
          role: "COMPANY_HR",
          title: "HR Officer (Sakar Unit III)",
          company_rights: ["Sakar-III"],
          password: "indraprakash",
          disabled: false
        },
        "nilesh": {
          id: "USR007",
          username: "nilesh",
          name: "Nilesh",
          role: "COMPANY_HR",
          title: "HR Officer (Flare)",
          company_rights: ["Flare-1"],
          password: "nilesh",
          disabled: false
        },
        "pinki": {
          id: "USR008",
          username: "pinki",
          name: "Pinki",
          role: "COMPANY_HR",
          title: "HR Officer (Zenivo)",
          company_rights: ["Zenivo-1"],
          password: "pinki",
          disabled: false
        },
        "audit": {
          id: "USR009",
          username: "audit",
          name: "Auditor",
          role: "AUDITOR",
          title: "Statutory Auditor",
          company_rights: ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III", "Flare-1", "Zenivo-1"],
          password: "audit",
          disabled: false
        }
      };
      const lowerUser = username.trim().toLowerCase();
      if (!user && defaultUsersMap[lowerUser]) {
        db.syncUser(defaultUsersMap[lowerUser]);
        users = db.getUsers();
        user = users.find((u) => u.username.toLowerCase() === lowerUser);
      }
      const userFound = user ? "Yes" : "No";
      const passwordMatch = user && user.password === password ? "Yes" : "No";
      const roleLoaded = user && user.role ? "Yes" : "No";
      console.log(`[Diagnostic Log] Selected User: ${username}, User Found: ${userFound}, Password Match: ${passwordMatch}, Role Loaded: ${roleLoaded}`);
      if (!user) {
        return res.status(404).json({ success: false, error: "User Not Found" });
      }
      if (user.disabled) {
        return res.status(403).json({ success: false, error: "User account is disabled" });
      }
      if (!user.role) {
        return res.status(400).json({ success: false, error: "Role Missing" });
      }
      if (isSecEnabled) {
        if (user.password !== password) {
          return res.status(401).json({ success: false, error: "Password Incorrect" });
        }
      }
      db.logAudit("User Login", `User ${user.name} (${user.username}) successfully logged in`, user.name);
      const isDefaultPin = user.role === "SUPER_HR" && await db.getSystemSetting("pin_changed_from_default", "0") === "0";
      const { password: _pw, ...safeUser } = user;
      res.json({ success: true, user: safeUser, forcePinChange: isDefaultPin });
    } catch (e) {
      console.error("[Login API Error]", e);
      res.status(500).json({ success: false, error: "Database Error" });
    }
  });
  app.post("/api/settings/change-pin", async (req, res) => {
    try {
      const { currentPin, newPin } = req.body;
      const operatorRole = getOperatorRole(req);
      if (operatorRole !== "SUPER_HR") {
        return res.status(403).json({ error: "Access Denied: Only Super Admin can change the Security PIN." });
      }
      if (!currentPin || !newPin) {
        return res.status(400).json({ error: "Current PIN and New PIN are required." });
      }
      const isCurrentValid = await verifyPin(currentPin);
      if (!isCurrentValid) {
        return res.status(403).json({ error: "CURRENT_PIN_INVALID", message: "The current Security PIN is incorrect." });
      }
      if (String(newPin).length < 4) {
        return res.status(400).json({ error: "PIN_TOO_SHORT", message: "New Security PIN must be at least 4 digits." });
      }
      const newHash = import_crypto2.default.createHash("sha256").update(String(newPin)).digest("hex");
      await db.setSystemSetting("super_admin_pin", newHash);
      await db.setSystemSetting("pin_changed_from_default", "1");
      db.logAudit("Security PIN Changed", "Super Admin Security PIN updated successfully", getOperator(req));
      res.json({ success: true, message: "Security PIN updated successfully." });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/festival-message", async (req, res) => {
    try {
      const defaultValue = JSON.stringify({
        message: "Wishing all our HR Teams and Employees of Sakar I, III, SVN I, II a very Happy Celebration! \u{1F1EE}\u{1F1F3}\u2728 Work hard, celebrate together.",
        isActive: true,
        displayDuration: 15
      });
      const val = await db.getSystemSetting("festival_message", defaultValue);
      let parsed = JSON.parse(val);
      if (!parsed.message || parsed.message.trim().length === 0) {
        parsed.message = "Wishing all our HR Teams and Employees of Sakar I, III, SVN I, II a very Happy Celebration! \u{1F1EE}\u{1F1F3}\u2728 Work hard, celebrate together.";
        parsed.isActive = true;
      }
      parsed.displayDuration = Math.max(15, Number(parsed.displayDuration || 15));
      res.json(parsed);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch festival message settings." });
    }
  });
  app.post("/api/festival-message", async (req, res) => {
    try {
      const { message, isActive, displayDuration } = req.body;
      const payload = {
        message: message || "",
        isActive: !!isActive,
        displayDuration: Math.max(15, Number(displayDuration || 15)),
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      await db.setSystemSetting("festival_message", JSON.stringify(payload));
      db.logAudit("Festival Message Updated", `Message: "${message}", Active: ${isActive}`, getOperator(req));
      res.json({ success: true, ...payload });
    } catch (e) {
      res.status(500).json({ error: "Failed to save festival message settings: " + e.message });
    }
  });
  app.get("/api/settings/security-mode", async (req, res) => {
    try {
      const value = await db.getSystemSetting("production_security_enabled", "0");
      res.json({ productionSecurityEnabled: value === "1" });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/settings/security-mode", async (req, res) => {
    try {
      const { enabled } = req.body;
      const value = enabled ? "1" : "0";
      await db.setSystemSetting("production_security_enabled", value);
      const statusText = enabled ? "ENABLED" : "DISABLED";
      db.logAudit("Security Change", `Production security was ${statusText}`, "System Settings");
      res.json({ success: true, productionSecurityEnabled: enabled });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.post("/api/hr/logout", (req, res) => {
    try {
      const { username, name } = req.body;
      if (username) {
        db.logAudit("User Logout", `User ${name || username} logged out`, name || username);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.post("/api/hr/users", (req, res) => {
    try {
      const user = req.body;
      if (!user.username || !user.name || !user.role) {
        return res.status(400).json({ error: "Username, Name, and Role are required" });
      }
      const users = db.getUsers();
      if (!user.id) {
        const exists = users.some((u) => u.username.toLowerCase() === user.username.toLowerCase());
        if (exists) {
          return res.status(400).json({ error: "Username already exists" });
        }
        let maxNum = 8;
        users.forEach((u) => {
          const match = u.id.match(/USR(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        });
        const nextNum = String(maxNum + 1).padStart(3, "0");
        user.id = `USR${nextNum}`;
        db.syncUser(user);
        db.logAudit("User Created", `Created user account for ${user.name} (${user.username}) as ${user.role}`, getOperator(req));
      } else {
        const exists = users.some((u) => u.username.toLowerCase() === user.username.toLowerCase() && u.id !== user.id);
        if (exists) {
          return res.status(400).json({ error: "Username already exists" });
        }
        db.syncUser(user);
        db.logAudit("User Updated", `Updated user account settings for ${user.name} (${user.username})`, getOperator(req));
      }
      const { password: _pw3, ...safeUserResp } = user;
      res.json({ success: true, user: safeUserResp });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/hr/users/:id", (req, res) => {
    try {
      const { id } = req.params;
      const users = db.getUsers();
      const user = users.find((u) => u.id === id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      db.deleteUser(id);
      db.logAudit("User Deleted", `Deleted user account for ${user.name} (${user.username})`, getOperator(req));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/hods", (req, res) => {
    try {
      res.json(db.getHods());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/hods", (req, res) => {
    try {
      let hod = req.body;
      if (!hod.name || !hod.department || !hod.company) {
        return res.status(400).json({ error: "Name, Department, and Company are required" });
      }
      const hods = db.getHods();
      if (!hod.id) {
        let maxNum = 4;
        hods.forEach((h) => {
          const match = h.id.match(/HOD(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxNum) maxNum = num;
          }
        });
        const nextNum = String(maxNum + 1).padStart(3, "0");
        hod = { ...hod, id: `HOD${nextNum}` };
        db.syncHod(hod);
        db.logAudit("HOD Created", `Created HOD master entry for ${hod.name} (${hod.department})`, getOperator(req));
      } else {
        db.syncHod(hod);
        db.logAudit("HOD Updated", `Updated HOD master entry for ${hod.name}`, getOperator(req));
      }
      res.json({ success: true, hod });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/hods/:id", (req, res) => {
    try {
      const { id } = req.params;
      const hods = db.getHods();
      const hod = hods.find((h) => h.id === id);
      if (!hod) {
        return res.status(404).json({ error: "HOD not found" });
      }
      db.deleteHod(id);
      db.logAudit("HOD Deleted", `Deleted HOD master entry for ${hod.name} (${hod.department})`, getOperator(req));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/shifts", (req, res) => {
    try {
      res.json(db.getShifts());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/shifts", (req, res) => {
    try {
      const shift = req.body;
      if (!shift.code || !shift.name || !shift.start_time || !shift.end_time) {
        return res.status(400).json({ error: "Shift Code, Shift Name, Start Time, and End Time are required" });
      }
      db.syncShift(shift);
      db.logAudit("Shift Synced", `Created/Updated shift: ${shift.name} (${shift.code})`, getOperator(req));
      res.json({ success: true, shift });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/shifts/:code", (req, res) => {
    try {
      const { code } = req.params;
      const shifts = db.getShifts();
      const shift = shifts.find((s) => s.code.toUpperCase() === code.toUpperCase());
      if (!shift) {
        return res.status(404).json({ error: "Shift not found" });
      }
      db.deleteShift(code);
      db.logAudit("Shift Deleted", `Deleted shift: ${shift.name} (${shift.code})`, getOperator(req));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/employee/login", (req, res) => {
    try {
      const { employeeId, password } = req.body;
      if (!employeeId) {
        return res.status(400).json({ success: false, error: "Employee ID is required" });
      }
      const employees = db.getEmployees();
      const employee = employees.find((e) => e.id.toLowerCase() === employeeId.toLowerCase());
      if (!employee) {
        return res.status(404).json({ success: false, error: "Employee not found" });
      }
      const currentPassword = employee.password || employee.id;
      const enteredPassword = password ? password.trim() : "";
      const isFirstTime = !employee.password || employee.password.toLowerCase() === employee.id.toLowerCase();
      let matches = false;
      if (isFirstTime) {
        matches = enteredPassword.toLowerCase() === currentPassword.toLowerCase();
      } else {
        matches = enteredPassword === currentPassword;
      }
      if (!matches) {
        return res.status(401).json({ success: false, error: "Incorrect Password. Note: First-time password is your Employee Code (e.g. EMP001)." });
      }
      const needsChange = !!employee.needs_password_change || isFirstTime;
      const { password: _pw, ...safeEmployee } = employee;
      res.json({ success: true, employee: safeEmployee, needsPasswordChange: needsChange });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.post("/api/employee/change-password", async (req, res) => {
    try {
      const { employeeId, oldPassword, newPassword } = req.body;
      if (!employeeId || !oldPassword || !newPassword) {
        return res.status(400).json({ success: false, error: "All fields are required" });
      }
      const employees = db.getEmployees();
      const employee = employees.find((e) => e.id.toLowerCase() === employeeId.toLowerCase());
      if (!employee) {
        return res.status(404).json({ success: false, error: "Employee not found" });
      }
      const currentPassword = employee.password || employee.id;
      const isFirstTime = !employee.password || employee.password.toLowerCase() === employee.id.toLowerCase();
      let matches = false;
      if (isFirstTime) {
        matches = oldPassword.toLowerCase() === currentPassword.toLowerCase();
      } else {
        matches = oldPassword === currentPassword;
      }
      if (!matches) {
        return res.status(401).json({ success: false, error: "Incorrect old password" });
      }
      const updated = db.updateEmployee(employee.id, {
        password: newPassword,
        needs_password_change: false
      });
      await db.persistDataSync();
      const { password: _pw2, ...safeUpdated } = updated;
      res.json({ success: true, employee: safeUpdated });
    } catch (e) {
      res.status(500).json({ success: false, error: e.message });
    }
  });
  app.post("/api/admin/reset-employee-password", async (req, res) => {
    try {
      const { employeeId, newPassword } = req.body;
      if (!employeeId) {
        return res.status(400).json({ error: "Employee ID is required" });
      }
      const employees = db.getEmployees();
      const employee = employees.find((e) => e.id.toLowerCase() === employeeId.toLowerCase());
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      const isResettingToDefault = newPassword.toLowerCase() === employee.id.toLowerCase();
      const updated = db.updateEmployee(employee.id, {
        password: newPassword,
        needs_password_change: isResettingToDefault ? true : false
      });
      await db.persistDataSync();
      db.logAudit("Password Reset", `Admin reset password for Employee ${employee.name} (${employee.id})`, getOperator(req));
      res.json({ success: true, employee: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/employees", async (req, res) => {
    try {
      const emp = req.body;
      if (!emp.name || !emp.designation || !emp.joining_date) {
        return res.status(400).json({ error: "Name, designation, and joining date are required fields" });
      }
      const saved = db.insertEmployee(emp);
      await db.persistDataSync();
      db.logAudit("Employee Created", `Created employee ${saved.name} (${saved.id}) in ${saved.company}`, getOperator(req));
      res.json({ success: true, employee: saved });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.put("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const operatorRole = getOperatorRole(req);
      const operatorName = getOperator(req);
      if (req.body.id && req.body.id.trim() !== id) {
        if (operatorRole !== "SUPER_HR") {
          return res.status(403).json({ error: "Access Denied: Only Super Admin (SUPER_HR) is authorized to modify Employee Codes." });
        }
      }
      const oldEmp = db.getEmployeeById(id);
      if (!oldEmp) {
        return res.status(404).json({ error: "Employee not found" });
      }
      const updated = db.updateEmployee(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Employee not found" });
      }
      await db.persistDataSync();
      const fieldsToTrack = [
        "company",
        "id",
        "name",
        "department",
        "designation",
        "joining_date",
        "exit_date",
        "email",
        "phone",
        "pan",
        "aadhaar_number",
        "uan",
        "esic_number",
        "bank_name",
        "bank_account",
        "ifsc",
        "cost_center",
        "employee_category",
        "shift_timing",
        "base_salary",
        "hra",
        "da",
        "special_allowance",
        "edu_allowance",
        "medical_allowance",
        "conveyance_allowance"
      ];
      fieldsToTrack.forEach((field) => {
        const oldValue = oldEmp[field];
        const newValue = req.body[field];
        const oldStr = oldValue !== void 0 && oldValue !== null ? String(oldValue) : "";
        const newStr = newValue !== void 0 && newValue !== null ? String(newValue) : "";
        if (newValue !== void 0 && oldStr !== newStr) {
          db.logAudit(
            "EMPLOYEE_FIELD_EDIT",
            `Employee:${updated.id} | Field:${field} | Old:${oldStr} | New:${newStr}`,
            operatorName
          );
        }
      });
      if (req.body.id && req.body.id.trim() !== id) {
        db.logAudit("Employee Code Changed", `Modified Employee Code of ${updated.name} from "${id}" to "${updated.id}"`, operatorName);
      } else {
        db.logAudit("Employee Edited", `Updated details for ${updated.name} (${updated.id})`, operatorName);
      }
      res.json({ success: true, employee: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const pin = req.headers["x-security-pin"] || req.query.pin || req.body.pin;
      const force = req.query.force === "true" || req.body.force === true;
      if (!await verifyPin(pin)) {
        return res.status(403).json({ error: "PIN_INVALID", message: "Invalid or missing Super Admin Security PIN." });
      }
      const emp = db.getEmployeeById(id);
      if (!emp) {
        return res.status(404).json({ error: "Employee not found" });
      }
      const name = emp.name;
      const outcome = db.deleteEmployee(id, force);
      if (outcome === "NOT_FOUND") {
        return res.status(404).json({ error: "Employee not found" });
      }
      if (outcome === "INACTIVATED") {
        db.logAudit("Employee Deactivated", `Soft-deleted employee ${name} (${id}) due to existing payroll/ledger history. Status set to SEPARATED.`, getOperator(req));
        res.json({ success: true, outcome: "INACTIVATED", message: "Employee has active payroll history. Profile soft-deleted and status updated to SEPARATED." });
      } else {
        db.logAudit("Employee Purged", `Permanently purged test/duplicate employee ${name} (${id}) from database.`, getOperator(req));
        res.json({ success: true, outcome: "PURGED", message: "Employee profile permanently purged from all database tables." });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/loans/policy", (req, res) => {
    res.json(db.getLoanPolicy());
  });
  app.post("/api/loans/policy", (req, res) => {
    try {
      db.updateLoanPolicy(req.body);
      res.json({ success: true, policy: db.getLoanPolicy() });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/loans", (req, res) => {
    const { employee_id } = req.query;
    const allowed = getAllowedCompanies(req);
    const loans = db.getLoans(employee_id);
    const enrichedLoans = loans.map((l) => {
      const emp = db.getEmployeeById(l.employee_id);
      const slips = db.getPayslipsByEmployee(l.employee_id);
      const slips_repaid = slips.reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
      const settlements = Array.isArray(l.settlements) ? l.settlements : [];
      const stl_repaid = settlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);
      const total_repaid = slips_repaid + stl_repaid;
      const opening_balance = l.opening_balance !== void 0 ? Number(l.opening_balance) : Number(l.amount || 0);
      const additional_total = (l.additional_loans || []).reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      const total_borrowed = opening_balance + additional_total;
      const outstanding_balance = Math.max(0, total_borrowed - total_repaid);
      let currentStatus = l.status || "ACTIVE";
      if (outstanding_balance <= 0 && currentStatus === "ACTIVE") {
        currentStatus = "CLOSED";
        db.updateLoanStatus(l.id, "CLOSED");
      }
      return {
        ...l,
        loan_number: l.loan_number || `LN-${l.id.substring(0, 8)}`,
        department: l.department || (emp ? emp.department : ""),
        company: l.company || (emp ? emp.company : ""),
        unit: l.unit || (emp ? emp.company : ""),
        loan_type: l.loan_type || "Employee Loan",
        opening_balance,
        opening_date: l.opening_date || "2026-04-01",
        employee_code: l.employee_code || l.employee_id,
        total_amount: total_borrowed,
        disbursal_month: l.month,
        total_repaid,
        outstanding_balance,
        status: currentStatus,
        skipped_months: Array.isArray(l.skipped_months) ? l.skipped_months : [],
        additional_loans: Array.isArray(l.additional_loans) ? l.additional_loans : [],
        settlements,
        audit_trail: Array.isArray(l.audit_trail) ? l.audit_trail : []
      };
    });
    if (allowed) {
      const emps = db.getEmployees();
      const allowedLoanIds = new Set(emps.filter((e) => allowed.includes(e.company)).map((e) => e.id));
      return res.json(enrichedLoans.filter((l) => allowedLoanIds.has(l.employee_id)));
    }
    res.json(enrichedLoans);
  });
  app.post("/api/loans", async (req, res) => {
    try {
      const loan = req.body;
      if (!loan.employee_id || loan.amount === void 0 || !loan.monthly_deduction || !loan.month) {
        return res.status(400).json({ error: "Employee ID, amount, monthly deduction, and month are required" });
      }
      const saved = db.addLoan(loan);
      await db.forcePersistToSupabase();
      res.json({ success: true, loan: saved });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.put("/api/loans/:id/status", (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (status !== "ACTIVE" && status !== "CLOSED") {
        return res.status(400).json({ error: "Invalid status" });
      }
      const success = db.updateLoanStatus(id, status);
      res.json({ success });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/loans/:id/skip-emi", (req, res) => {
    try {
      const { id } = req.params;
      const { month, action, reason } = req.body;
      if (!month || action !== "SKIP" && action !== "UNSKIP") {
        return res.status(400).json({ error: "Month and valid action (SKIP/UNSKIP) are required" });
      }
      const updated = db.skipLoanEmi(id, month, action, reason);
      if (!updated) {
        return res.status(404).json({ error: "Loan record not found" });
      }
      res.json({ success: true, loan: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/loans/:id/add-amount", (req, res) => {
    try {
      const { id } = req.params;
      const { amount, month, reason } = req.body;
      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({ error: "Valid positive loan amount is required" });
      }
      const updated = db.addLoanAmount(id, Number(amount), month || "2026-04", reason);
      if (!updated) {
        return res.status(404).json({ error: "Loan record not found" });
      }
      res.json({ success: true, loan: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.put("/api/loans/:id/details", async (req, res) => {
    try {
      const { id } = req.params;
      const updated = db.updateLoanDetails(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Loan record not found" });
      }
      await db.forcePersistToSupabase();
      res.json({ success: true, loan: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/loans/:id/settlement", (req, res) => {
    try {
      const { id } = req.params;
      const { amount, recovery_type, payment_mode, reference_number, approved_by, remarks, date } = req.body;
      if (!amount || Number(amount) <= 0 || !recovery_type || !payment_mode) {
        return res.status(400).json({ error: "Valid amount, recovery_type, and payment_mode are required" });
      }
      const updated = db.settleLoan(id, {
        amount: Number(amount),
        recovery_type,
        payment_mode,
        reference_number,
        approved_by,
        remarks,
        date
      });
      if (!updated) {
        return res.status(404).json({ error: "Loan record not found" });
      }
      res.json({ success: true, loan: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/attendance/employee/:employeeId", (req, res) => {
    const { employeeId } = req.params;
    const records = db.getEmployeeAttendance(employeeId);
    res.json(records);
  });
  app.post("/api/attendance/manual", async (req, res) => {
    try {
      const { employee_id, date, status, hours, reason } = req.body;
      if (!employee_id || !date || !status) {
        return res.status(400).json({ error: "Employee ID, date, and status are required" });
      }
      const emp = db.getEmployeeById(employee_id);
      if (!emp) {
        return res.status(404).json({ error: "Employee not found" });
      }
      const month = date.substring(0, 7);
      const records = db.getEmployeeAttendance(employee_id);
      let record = records.find((r) => r.month === month);
      if (!record) {
        const daysInMonth = new Date(
          parseInt(month.split("-")[0]),
          parseInt(month.split("-")[1]),
          0
        ).getDate();
        record = {
          id: `ATT-${employee_id}-${month}`,
          employee_id,
          month,
          total_days: daysInMonth,
          working_days: daysInMonth,
          lop_days: 0,
          overtime_hours: 0,
          present: daysInMonth - 4,
          absent: 0,
          weekly_off: 4,
          paid_holiday: 0,
          leave: 0,
          lwp: 0,
          ot_hours: 0
        };
      }
      if (status === "PRESENT") {
        record.present = (record.present || 0) + 1;
        if (record.absent && record.absent > 0) {
          record.absent = record.absent - 1;
        } else if (record.lwp && record.lwp > 0) {
          record.lwp = record.lwp - 1;
        }
      } else if (status === "LWP" || status === "ABSENT") {
        if (status === "LWP") {
          record.lwp = (record.lwp || 0) + 1;
        } else {
          record.absent = (record.absent || 0) + 1;
        }
        if (record.present && record.present > 0) {
          record.present = record.present - 1;
        }
      } else if (status === "LEAVE") {
        record.leave = (record.leave || 0) + 1;
        if (record.present && record.present > 0) {
          record.present = record.present - 1;
        }
      }
      const numHours = parseFloat(hours) || 8;
      if (numHours > 8) {
        const ot = numHours - 8;
        record.ot_hours = (record.ot_hours || 0) + ot;
        record.overtime_hours = (record.overtime_hours || 0) + ot;
      }
      const pres = record.present || 0;
      const abs = record.absent || 0;
      const woff = record.weekly_off || 0;
      const phol = record.paid_holiday || 0;
      const lve = record.leave || 0;
      const lw = record.lwp || 0;
      record.total_days = pres + abs + woff + phol + lve + lw;
      record.lop_days = abs + lw;
      record.working_days = pres + woff + phol + lve;
      db.saveAttendance([record]);
      db.logAudit(
        "Manual Attendance Logs",
        `Employee ${emp.name} logged manual card for ${date} as ${status}. Hours: ${hours}. Reason: ${reason}`,
        emp.name
      );
      res.json({ success: true, message: "Manual attendance log saved", record });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/attendance", (req, res) => {
    const { month, company } = req.query;
    if (!month) {
      return res.status(400).json({ error: "Month (YYYY-MM) query parameter is required" });
    }
    const allowed = getAllowedCompanies(req);
    let targetCompany = company;
    if (allowed) {
      if (company && company !== "ALL") {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
      } else {
        targetCompany = allowed[0];
      }
    }
    const records = db.getAttendance(month, targetCompany);
    res.json(records);
  });
  app.post("/api/attendance/bulk", (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: "No attendance records provided" });
      }
      const first = records[0];
      const emp = db.getEmployeeById(first.employee_id);
      const company = emp ? emp.company : void 0;
      db.saveAttendance(records);
      db.logAudit("Attendance Modified", `Adjusted attendance coordinates for ${records.length} staff members for month ${first.month} (${company || "ALL"})`, getOperator(req));
      res.json({ success: true, count: records.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/admin/attendance/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const dbSqlite = db.dbSqlite;
      dbSqlite.run("DELETE FROM attendance WHERE id = ?", [id]);
      const data = db.data;
      if (data.attendance) {
        db.data.attendance = data.attendance.filter((a) => a.id !== id);
      }
      await db.persistDataSync();
      res.json({ success: true, deleted: id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.put("/api/admin/attendance/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const dbSqlite = db.dbSqlite;
      const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(", ");
      const values = [...Object.values(updates), id];
      dbSqlite.run(`UPDATE attendance SET ${setClauses} WHERE id = ?`, values);
      const data = db.data;
      if (data.attendance) {
        const att = data.attendance.find((a) => a.id === id);
        if (att) Object.assign(att, updates);
      }
      await db.persistDataSync();
      res.json({ success: true, updated: id, fields: Object.keys(updates) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/compoff", (req, res) => {
    const { company } = req.query;
    const allowed = getAllowedCompanies(req);
    if (allowed) {
      if (company && company !== "ALL") {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
        return res.json(db.getCompOffRequests().filter((c) => c.company === company));
      } else {
        const allCompoffs = db.getCompOffRequests();
        return res.json(allCompoffs.filter((c) => allowed.includes(c.company)));
      }
    }
    if (company && company !== "ALL") {
      return res.json(db.getCompOffRequests().filter((c) => c.company === company));
    }
    res.json(db.getCompOffRequests());
  });
  app.get("/api/leaves", (req, res) => {
    const { company } = req.query;
    const allowed = getAllowedCompanies(req);
    if (allowed) {
      if (company && company !== "ALL") {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
        return res.json(db.getLeaveApplications(company));
      } else {
        const allLeaves = db.getLeaveApplications();
        return res.json(allLeaves.filter((l) => allowed.includes(l.company)));
      }
    }
    res.json(db.getLeaveApplications(company));
  });
  app.post("/api/leaves", async (req, res) => {
    try {
      const appReg = db.addLeaveApplication(req.body);
      await db.persistDataSync();
      res.json({ success: true, application: appReg });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/leaves/status", async (req, res) => {
    const { id, status } = req.body;
    const success = db.updateLeaveStatus(id, status);
    if (!success) {
      return res.status(404).json({ error: "Leave request not found" });
    }
    await db.persistDataSync();
    res.json({ success: true });
  });
  app.post("/api/leaves/workflow", async (req, res) => {
    try {
      const { id, actorRole, action, actorId, override } = req.body;
      let success = db.updateLeaveWorkflowStatus(id, actorRole, action, actorId, override);
      if (!success) {
        await db.reloadFromSupabase();
        success = db.updateLeaveWorkflowStatus(id, actorRole, action, actorId, override);
      }
      if (!success) {
        return res.status(400).json({ error: "Failed to update leave workflow status or request not found." });
      }
      await db.persistDataSync();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.put("/api/employees/:id/leave-opening", async (req, res) => {
    try {
      const operatorRole = getOperatorRole(req);
      if (operatorRole !== "SUPER_HR") {
        return res.status(403).json({ error: "Only Super Admin can edit leave opening balance" });
      }
      const { id } = req.params;
      const { leave_balance_pl, leave_balance_cl, leave_balance_sl, leave_balance_compoff } = req.body;
      const emp = db.getEmployeeById(id);
      if (!emp) return res.status(404).json({ error: "Employee not found" });
      if (leave_balance_pl !== void 0) emp.leave_balance_pl = Number(leave_balance_pl);
      if (leave_balance_cl !== void 0) emp.leave_balance_cl = Number(leave_balance_cl);
      if (leave_balance_sl !== void 0) emp.leave_balance_sl = Number(leave_balance_sl);
      if (leave_balance_compoff !== void 0) emp.leave_balance_compoff = Number(leave_balance_compoff);
      db.dbSqlite.run(
        `UPDATE employees SET leave_balance_pl = ?, leave_balance_cl = ?, leave_balance_sl = ?, leave_balance_compoff = ? WHERE id = ?`,
        [emp.leave_balance_pl, emp.leave_balance_cl, emp.leave_balance_sl, emp.leave_balance_compoff || 0, id]
      );
      db.logAudit("Leave Opening Updated", `Updated leave opening for ${emp.name} (PL:${emp.leave_balance_pl}, CL:${emp.leave_balance_cl}, SL:${emp.leave_balance_sl}, C-Off:${emp.leave_balance_compoff || 0})`, getOperator(req));
      await db.persistDataSync();
      res.json({ success: true, employee: { id: emp.id, leave_balance_pl: emp.leave_balance_pl, leave_balance_cl: emp.leave_balance_cl, leave_balance_sl: emp.leave_balance_sl, leave_balance_compoff: emp.leave_balance_compoff || 0 } });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/leave-opening-bulk", async (req, res) => {
    try {
      const operatorRole = getOperatorRole(req);
      if (operatorRole !== "SUPER_HR") {
        return res.status(403).json({ error: "Only Super Admin can set bulk leave opening balance" });
      }
      const { employees, default_balance } = req.body;
      const allEmps = db.getEmployees();
      let updated = 0;
      if (Array.isArray(employees)) {
        for (const e of employees) {
          const emp = allEmps.find((x) => x.id === e.id);
          if (!emp) continue;
          emp.leave_balance_pl = Number(e.pl ?? emp.leave_balance_pl);
          emp.leave_balance_cl = Number(e.cl ?? emp.leave_balance_cl);
          emp.leave_balance_sl = Number(e.sl ?? emp.leave_balance_sl);
          emp.leave_balance_compoff = Number(e.compoff ?? emp.leave_balance_compoff ?? 0);
          if (db.dbSqlite) db.dbSqlite.run(
            `UPDATE employees SET leave_balance_pl = ?, leave_balance_cl = ?, leave_balance_sl = ?, leave_balance_compoff = ? WHERE id = ?`,
            [emp.leave_balance_pl, emp.leave_balance_cl, emp.leave_balance_sl, emp.leave_balance_compoff, emp.id]
          );
          updated++;
        }
      } else if (default_balance) {
        const { pl = 18, cl = 6, sl = 6, compoff = 0 } = default_balance;
        for (const emp of allEmps) {
          if (emp.status === "ACTIVE") {
            emp.leave_balance_pl = Number(pl);
            emp.leave_balance_cl = Number(cl);
            emp.leave_balance_sl = Number(sl);
            emp.leave_balance_compoff = Number(compoff);
            if (db.dbSqlite) db.dbSqlite.run(
              `UPDATE employees SET leave_balance_pl = ?, leave_balance_cl = ?, leave_balance_sl = ?, leave_balance_compoff = ? WHERE id = ?`,
              [emp.leave_balance_pl, emp.leave_balance_cl, emp.leave_balance_sl, emp.leave_balance_compoff, emp.id]
            );
            updated++;
          }
        }
      }
      db.logAudit("Leave Opening Bulk Update", `Updated leave opening for ${updated} employees`, getOperator(req));
      await db.persistDataSync();
      res.json({ success: true, updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/leave-utilization-bulk", async (req, res) => {
    try {
      const { month, company, entries } = req.body;
      if (!month || !Array.isArray(entries)) {
        return res.status(400).json({ error: "month and entries array required" });
      }
      let updated = 0;
      const allEmps = db.getEmployees();
      for (const entry of entries) {
        const emp = allEmps.find((e) => e.id === entry.employee_id);
        if (!emp) continue;
        if (company && company !== "ALL" && emp.company !== company) continue;
        const plDays = Number(entry.pl_days || 0);
        const clDays = Number(entry.cl_days || 0);
        const slDays = Number(entry.sl_days || 0);
        const compoffDays = Number(entry.compoff_days || 0);
        const totalLeave = plDays + clDays + slDays + compoffDays;
        if (totalLeave === 0) continue;
        const attId = `ATT-${emp.id}-${month}`;
        let att = db.getAttendance().find((a) => a.employee_id === emp.id && a.month === month);
        if (!att) {
          att = {
            id: attId,
            employee_id: emp.id,
            month,
            total_days: 30,
            working_days: 30,
            lop_days: 0,
            overtime_hours: 0,
            present: 0,
            absent: 0,
            weekly_off: 0,
            paid_holiday: 0,
            leave: 0,
            lwp: 0,
            leave_pl: 0,
            leave_cl: 0,
            leave_sl: 0,
            leave_coff: 0
          };
          db.data.attendance.push(att);
        }
        att.leave_pl = plDays;
        att.leave_cl = clDays;
        att.leave_sl = slDays;
        att.leave_coff = compoffDays;
        att.leave = totalLeave;
        att.working_days = (att.present || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + att.leave;
        att.lop_days = (att.absent || 0) + (att.lwp || 0);
        att.total_days = (att.present || 0) + (att.absent || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + att.leave + (att.lwp || 0);
        if (plDays > 0) emp.leave_balance_pl = Math.max(0, (emp.leave_balance_pl || 0) - plDays);
        if (clDays > 0) emp.leave_balance_cl = Math.max(0, (emp.leave_balance_cl || 0) - clDays);
        if (slDays > 0) emp.leave_balance_sl = Math.max(0, (emp.leave_balance_sl || 0) - slDays);
        if (compoffDays > 0) emp.leave_balance_compoff = Math.max(0, (emp.leave_balance_compoff || 0) - compoffDays);
        if (db.dbSqlite && typeof db.dbSqlite.run === "function") {
          db.dbSqlite.run(
            `INSERT OR REPLACE INTO attendance (id, employee_id, month, total_days, working_days, lop_days, overtime_hours, present, absent, weekly_off, paid_holiday, leave, lwp, ot_hours, is_locked, leave_pl, leave_cl, leave_sl, leave_coff, pay_days) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [att.id, att.employee_id, att.month, att.total_days, att.working_days, att.lop_days, att.overtime_hours || 0, att.present || 0, att.absent || 0, att.weekly_off || 0, att.paid_holiday || 0, att.leave || 0, att.lwp || 0, att.overtime_hours || 0, att.is_locked ? 1 : 0, att.leave_pl || 0, att.leave_cl || 0, att.leave_sl || 0, att.leave_coff || 0, att.pay_days || null]
          );
          db.dbSqlite.run(
            `UPDATE employees SET leave_balance_pl = ?, leave_balance_cl = ?, leave_balance_sl = ?, leave_balance_compoff = ? WHERE id = ?`,
            [emp.leave_balance_pl, emp.leave_balance_cl, emp.leave_balance_sl, emp.leave_balance_compoff || 0, emp.id]
          );
        }
        updated++;
      }
      db.logAudit("Leave Utilization Bulk", `Updated leave utilization for ${updated} employees in ${month}`, getOperator(req));
      await db.persistDataSync();
      res.json({ success: true, updated, month });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/leave-utilization", (req, res) => {
    try {
      const { month, company } = req.query;
      if (!month) return res.status(400).json({ error: "month required" });
      const allEmps = db.getEmployees();
      let filteredEmps = allEmps.filter((e) => e.status === "ACTIVE");
      if (company && company !== "ALL") {
        filteredEmps = filteredEmps.filter((e) => e.company === company);
      }
      const utilization = filteredEmps.map((emp) => {
        const att = db.getAttendance().find((a) => a.employee_id === emp.id && a.month === month);
        return {
          employee_id: emp.id,
          employee_name: emp.name,
          company: emp.company,
          designation: emp.designation || "",
          department: emp.department || "",
          // Current utilization
          pl_days: att?.leave_pl || 0,
          cl_days: att?.leave_cl || 0,
          sl_days: att?.leave_sl || 0,
          compoff_days: att?.leave_coff || 0,
          total_leave: att?.leave || 0,
          present: att?.present || 0,
          absent: att?.absent || 0,
          weekly_off: att?.weekly_off || 0,
          paid_holiday: att?.paid_holiday || 0,
          // Remaining balance
          balance_pl: emp.leave_balance_pl || 0,
          balance_cl: emp.leave_balance_cl || 0,
          balance_sl: emp.leave_balance_sl || 0,
          balance_compoff: emp.leave_balance_compoff || 0
        };
      });
      res.json({ month, company: company || "ALL", employees: utilization });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/leave-register", (req, res) => {
    try {
      const { month, company } = req.query;
      const allLeaves = db.getLeaveApplications();
      let filtered = allLeaves;
      if (month) {
        filtered = filtered.filter((l) => {
          const sd = l.start_date || "";
          return sd.startsWith(month);
        });
      }
      if (company && company !== "ALL") {
        filtered = filtered.filter((l) => l.company === company);
      }
      const allEmps = db.getEmployees();
      const filteredEmps = company && company !== "ALL" ? allEmps.filter((e) => e.company === company) : allEmps;
      const leaveSummary = filteredEmps.filter((e) => e.status === "ACTIVE").map((emp) => {
        const att = db.getAttendance().find((a) => a.employee_id === emp.id && a.month === month);
        return {
          employee_id: emp.id,
          employee_name: emp.name || "Unknown",
          company: emp.company || "",
          designation: emp.designation || "",
          month: month || "",
          // Attendance data (from attendance register)
          total_days: att?.total_days || 30,
          present: att?.present || 0,
          absent: att?.absent || 0,
          weekly_off: att?.weekly_off || 0,
          paid_holiday: att?.paid_holiday || 0,
          // Leave taken this month (from attendance)
          leave_pl: att?.leave_pl || 0,
          leave_cl: att?.leave_cl || 0,
          leave_sl: att?.leave_sl || 0,
          leave_coff: att?.leave_coff || 0,
          total_leave_taken: att?.leave || 0,
          lwp: att?.lwp || 0,
          // Current remaining balance (from employee master)
          balance_pl: emp.leave_balance_pl || 0,
          balance_cl: emp.leave_balance_cl || 0,
          balance_sl: emp.leave_balance_sl || 0,
          balance_compoff: emp.leave_balance_compoff || 0,
          balance_total: (emp.leave_balance_pl || 0) + (emp.leave_balance_cl || 0) + (emp.leave_balance_sl || 0) + (emp.leave_balance_compoff || 0)
        };
      });
      res.json({
        leaves: filtered,
        summary: leaveSummary,
        month: month || "ALL",
        company: company || "ALL"
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/bonus-register", (req, res) => {
    try {
      const { month, company, fy } = req.query;
      const allEmps = db.getEmployees();
      let filteredEmps = allEmps.filter((e) => e.status === "ACTIVE");
      if (company && company !== "ALL") {
        filteredEmps = filteredEmps.filter((e) => e.company === company);
      }
      const bonusData = filteredEmps.map((emp) => {
        const baseSalary = emp.base_salary || 0;
        const bonusRate = 8.33;
        const monthlyBonus = Math.round(baseSalary * bonusRate / 100);
        const allBonuses = db.data.bonus_provisions || [];
        const empBonuses = allBonuses.filter((b) => b.employee_id === emp.id);
        let monthBonus = null;
        if (month) {
          monthBonus = empBonuses.find((b) => b.month === month);
        }
        let annualBonuses = empBonuses;
        if (fy) {
          const fyParts = fy.split("-");
          const startYear = parseInt(fyParts[0]);
          const startMonth = `${startYear}-04`;
          const endMonth = `${startYear + 1}-03`;
          annualBonuses = empBonuses.filter((b) => b.month >= startMonth && b.month <= endMonth);
        }
        const annualTotal = annualBonuses.reduce((sum, b) => sum + (b.bonus_amount || 0), 0);
        const annualPaid = annualBonuses.filter((b) => b.status === "PAID").reduce((sum, b) => sum + (b.bonus_amount || 0), 0);
        const annualPending = annualTotal - annualPaid;
        return {
          employee_id: emp.id,
          employee_name: emp.name,
          company: emp.company,
          designation: emp.designation || "",
          department: emp.department || "",
          base_salary: baseSalary,
          bonus_rate: bonusRate,
          monthly_bonus: monthlyBonus,
          // Current month
          month_status: monthBonus?.status || "NOT_PROCESSED",
          month_bonus_amount: monthBonus?.bonus_amount || 0,
          // Annual (Oct-Sep cycle)
          annual_total: annualTotal,
          annual_paid: annualPaid,
          annual_pending: annualPending,
          // Detailed month-wise
          month_wise: annualBonuses.map((b) => ({
            month: b.month,
            amount: b.bonus_amount,
            status: b.status,
            paid_in_month: b.paid_in_month
          }))
        };
      });
      res.json({
        fy: fy || "2026-27",
        company: company || "ALL",
        month: month || "ALL",
        employees: bonusData,
        totals: {
          employees: bonusData.length,
          annual_total: bonusData.reduce((s, b) => s + b.annual_total, 0),
          annual_paid: bonusData.reduce((s, b) => s + b.annual_paid, 0),
          annual_pending: bonusData.reduce((s, b) => s + b.annual_pending, 0)
        }
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/bonus-register/pay", async (req, res) => {
    try {
      const operatorRole = getOperatorRole(req);
      if (operatorRole !== "SUPER_HR") {
        return res.status(403).json({ error: "Only Super Admin can mark bonus as paid" });
      }
      const { month, company, employee_ids } = req.body;
      if (!month) return res.status(400).json({ error: "Payment month is required" });
      const allBonuses = db.data.bonus_provisions || [];
      let updated = 0;
      for (const bonus of allBonuses) {
        if (bonus.status !== "ACCUMULATED") continue;
        if (employee_ids && !employee_ids.includes(bonus.employee_id)) continue;
        if (company && company !== "ALL" && bonus.company !== company) continue;
        bonus.status = "PAID";
        bonus.paid_in_month = month;
        updated++;
        if (db.dbSqlite) {
          db.dbSqlite.run(`UPDATE bonus_provisions SET status = 'PAID', paid_in_month = ? WHERE id = ?`, [month, bonus.id]);
        }
      }
      db.logAudit("Bonus Paid", `Marked bonus as PAID for ${updated} employees in ${month}`, getOperator(req));
      await db.persistDataSync();
      res.json({ success: true, updated, month });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/attendance/corrections", (req, res) => {
    try {
      const { company, employee_id } = req.query;
      const allowed = getAllowedCompanies(req);
      let corrections = db.getAttendanceCorrections();
      if (employee_id) {
        corrections = corrections.filter((c) => c.employee_id === employee_id);
      } else if (allowed) {
        if (company && company !== "ALL") {
          if (!allowed.includes(company)) {
            return res.json([]);
          }
          corrections = corrections.filter((c) => c.company === company);
        } else {
          corrections = corrections.filter((c) => allowed.includes(c.company));
        }
      } else if (company && company !== "ALL") {
        corrections = corrections.filter((c) => c.company === company);
      }
      res.json(corrections);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/attendance/corrections", async (req, res) => {
    try {
      const correction = db.addAttendanceCorrection(req.body);
      await db.persistDataSync();
      res.json({ success: true, correction });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/attendance/corrections/workflow", async (req, res) => {
    try {
      const { id, actorRole, action, actorId, override } = req.body;
      let success = db.updateAttendanceCorrectionWorkflowStatus(id, actorRole, action, actorId, override);
      if (!success) {
        await db.reloadFromSupabase();
        success = db.updateAttendanceCorrectionWorkflowStatus(id, actorRole, action, actorId, override);
      }
      if (!success) {
        return res.status(400).json({ error: "Failed to update attendance correction workflow status." });
      }
      await db.persistDataSync();
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/compoff-ledger", (req, res) => {
    try {
      const { employee_id } = req.query;
      let ledger = db.getCompOffLedger();
      if (employee_id) {
        ledger = ledger.filter((c) => c.employee_id === employee_id);
      }
      res.json(ledger);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/compoff-ledger", (req, res) => {
    try {
      const entry = db.addCompOffLedgerEntry(req.body);
      res.json({ success: true, entry });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/policies", (req, res) => {
    try {
      res.json(db.getPolicies());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/policies", (req, res) => {
    try {
      const policy = db.addPolicy(req.body);
      res.json({ success: true, policy });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/policy-acknowledgements", (req, res) => {
    try {
      const { employee_id } = req.query;
      let acks = db.getPolicyAcknowledgements();
      if (employee_id) {
        acks = acks.filter((a) => a.employee_id === employee_id);
      }
      res.json(acks);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/policy-acknowledgements", (req, res) => {
    try {
      const ack = db.addPolicyAcknowledgement(req.body);
      res.json({ success: true, ack });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/ff", (req, res) => {
    const { company } = req.query;
    const allowed = getAllowedCompanies(req);
    if (allowed) {
      if (company && company !== "ALL") {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
        return res.json(db.getFFSettlements(company));
      } else {
        const allFF = db.getFFSettlements();
        return res.json(allFF.filter((ff) => {
          const emp = db.getEmployees().find((e) => e.id === ff.employee_id);
          return emp && allowed.includes(emp.company);
        }));
      }
    }
    res.json(db.getFFSettlements(company));
  });
  app.get("/api/ff/calculate", (req, res) => {
    const { employee_id, last_working_day } = req.query;
    if (!employee_id || !last_working_day) {
      return res.status(400).json({ error: "employee_id and last_working_day parameters are required" });
    }
    try {
      const \u0440\u0430\u0441\u0447\u0435\u0442 = db.calculateFFSettlement(employee_id, last_working_day);
      res.json(\u0440\u0430\u0441\u0447\u0435\u0442);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/ff", (req, res) => {
    try {
      db.saveFFSettlement(req.body);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/form16/:employeeId", (req, res) => {
    const { employeeId } = req.params;
    try {
      const calculation = db.calculateForm16(employeeId);
      res.json(calculation);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/delivery/send", (req, res) => {
    const { employeeId, method, media, month } = req.body;
    const emp = db.getEmployeeById(employeeId);
    if (!emp) {
      return res.status(404).json({ error: "Employee not found" });
    }
    const payload = method === "EMAIL" ? emp.email : emp.phone;
    if (media === "CONFIRMATION") {
      const slips = db.getPayslipsByEmployee(employeeId);
      const slip = slips.find((s) => s.month === month);
      const amount = slip ? slip.net_salary : emp.base_salary;
      const last4 = emp.bank_account ? emp.bank_account.slice(-4) : "XXXX";
      const parts = month.split("-");
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const monthFormatted = parts.length === 2 ? `${monthNames[parseInt(parts[1]) - 1]} ${parts[0]}` : month;
      const payDate = slip && slip.payment_date ? slip.payment_date : (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const template = `Dear Employee,

Your salary for the month of ${monthFormatted} has been credited.

Net Salary:
\u20B9 ${amount.toLocaleString("en-IN")}

Bank Account:
XXXXXX${last4}

Payment Date:
${payDate}

Regards,
HR Department`;
      console.log(`[SIMULATOR DETECTED] Dispatched Salary Payment Confirmation for ${monthFormatted} to ${emp.name} at ${payload} via ${method}`);
      return res.json({
        success: true,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        message: `Successfully sent Salary Payment Confirmation for ${monthFormatted} via ${method} to ${emp.name} at ${payload}!`,
        preview: template
      });
    }
    console.log(`[SIMULATOR DETECTED] Sending ${month} payslip via ${method} specifically to ${emp.name} at ${payload}`);
    res.json({
      success: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      message: `Successfully dispatched salary invoice slip for ${month} via automated ${method} to ${emp.name} at ${payload}!`
    });
  });
  app.post("/api/sql/query", (req, res) => {
    const { sql } = req.body;
    if (!sql || typeof sql !== "string") {
      return res.status(400).json({ error: "Invalid or missing SQL statement" });
    }
    const result = db.querySQL(sql);
    res.json(result);
  });
  app.get("/api/payroll-runs", (req, res) => {
    const allowed = getAllowedCompanies(req);
    const runs = db.getPayrollRuns();
    if (allowed) {
      return res.json(runs.filter((r) => allowed.some((comp) => r.id.endsWith(`-${comp}`)) || r.id === `RUN-${r.month}`));
    }
    res.json(runs);
  });
  app.get("/api/payslips/month/:month", (req, res) => {
    const { month } = req.params;
    const { company } = req.query;
    const allowed = getAllowedCompanies(req);
    if (allowed) {
      if (company && company !== "ALL") {
        if (!allowed.includes(company)) {
          return res.json([]);
        }
        return res.json(db.getPayslipsByMonth(month, company));
      } else {
        const slips = db.getPayslipsByMonth(month);
        const emps = db.getEmployees();
        const empCompanyMap = new Map(emps.map((e) => [e.id, e.company]));
        return res.json(slips.filter((s) => {
          const comp = empCompanyMap.get(s.employee_id);
          return comp && allowed.includes(comp);
        }));
      }
    }
    res.json(db.getPayslipsByMonth(month, company));
  });
  app.get("/api/payslips/employee/:id", (req, res) => {
    const { id } = req.params;
    const allowed = getAllowedCompanies(req);
    const slips = db.getPayslipsByEmployee(id);
    if (allowed) {
      const emp = db.getEmployeeById(id);
      if (!emp || !allowed.includes(emp.company)) {
        return res.json([]);
      }
    }
    res.json(slips);
  });
  app.put("/api/payslips/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { pf, esic, pt, tds, loan, advance, custom } = req.body;
      const allowed = getAllowedCompanies(req);
      const slip = db.getPayslipById(id);
      if (!slip) {
        return res.status(404).json({ error: "Payslip not found" });
      }
      if (allowed) {
        const emp = db.getEmployeeById(slip.employee_id);
        if (!emp || !allowed.includes(emp.company)) {
          return res.status(403).json({ error: "Forbidden to access this company" });
        }
      }
      const empCompany = db.getEmployeeById(slip.employee_id)?.company;
      const isLocked = db.isPayrollLocked(slip.month, empCompany);
      if (isLocked) {
        const hasSalaryChanges = req.body.pf !== void 0 || req.body.pf_deduction !== void 0 || req.body.esic !== void 0 || req.body.esic_deduction !== void 0 || req.body.pt !== void 0 || req.body.professional_tax !== void 0 || req.body.tds !== void 0 || req.body.loan !== void 0 || req.body.loan_deduction !== void 0 || req.body.advance !== void 0 || req.body.salary_advance !== void 0 || req.body.custom !== void 0 || req.body.custom_deductions !== void 0 || req.body.rate_base_salary !== void 0;
        if (hasSalaryChanges) {
          return res.status(400).json({ error: "Payroll month is locked. Salary edits are not allowed. You can still edit attendance (Pay Days / LOP Days)." });
        }
      }
      const updated = db.updatePayslipFullVariableInputs(id, req.body);
      if (!updated) {
        return res.status(500).json({ error: "Failed to update payslip" });
      }
      await db.persistDataSync();
      db.logAudit("Payslip Deduction Adjusted", `Adjusted payroll deductions for employee ${slip.employee_name} (${slip.month})`, getOperator(req));
      res.json({ success: true, slip: updated });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/payslips/bulk-update-inputs", async (req, res) => {
    try {
      const { month, company, records } = req.body;
      if (!month || !Array.isArray(records)) {
        return res.status(400).json({ error: "Month and records array required" });
      }
      const isLocked = db.isPayrollLocked(month, company);
      const updatedSlips = [];
      const errors = [];
      for (const rec of records) {
        let slipId = rec.id;
        if (!slipId && rec.employee_id) {
          slipId = `SLIP-${rec.employee_id}-${month}`;
        } else if (!slipId && rec.emp_code) {
          const emp = db.getEmployees().find((e) => e.emp_code === rec.emp_code);
          if (emp) {
            slipId = `SLIP-${emp.id}-${month}`;
          } else {
            errors.push(`Invalid Employee Code: ${rec.emp_code}`);
            continue;
          }
        }
        if (slipId) {
          if (isLocked) {
            const attendanceOnly = { pay_days: rec.pay_days, lop_days: rec.lop_days };
            if (attendanceOnly.pay_days !== void 0 || attendanceOnly.lop_days !== void 0) {
              const resSlip = db.updatePayslipFullVariableInputs(slipId, attendanceOnly);
              if (resSlip) updatedSlips.push(resSlip);
            }
          } else {
            const resSlip = db.updatePayslipFullVariableInputs(slipId, rec);
            if (resSlip) {
              updatedSlips.push(resSlip);
            } else {
              errors.push(`Payslip not found for ID: ${slipId}`);
            }
          }
        }
      }
      await db.persistDataSync();
      db.logAudit("Bulk Payroll Variable Inputs Updated", `Updated ${updatedSlips.length} payroll inputs for month ${month} (${company || "ALL"})`, getOperator(req));
      res.json({ success: true, count: updatedSlips.length, errors, slips: db.getPayslipsByMonth(month, company) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/payslips/copy-previous-inputs", (req, res) => {
    try {
      const { month, company } = req.body;
      if (!month) return res.status(400).json({ error: "Month is required" });
      if (db.isPayrollLocked(month, company)) {
        return res.status(400).json({ error: "Payroll month is locked." });
      }
      const [year, m] = month.split("-").map(Number);
      const prevDate = new Date(year, m - 2, 1);
      const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
      const prevSlips = db.getPayslipsByMonth(prevMonth, company);
      const currentSlips = db.getPayslipsByMonth(month, company);
      let copiedCount = 0;
      for (const cur of currentSlips) {
        const prev = prevSlips.find((p) => p.employee_id === cur.employee_id);
        if (prev) {
          db.updatePayslipFullVariableInputs(cur.id, {
            tds: prev.tds || 0,
            custom_deductions: prev.custom_deductions || 0,
            canteen_deduction: prev.canteen_deduction || 0,
            uniform_deduction: prev.uniform_deduction || 0,
            notice_deduction: prev.notice_deduction || 0,
            mobile_deduction: prev.mobile_deduction || 0,
            damage_deduction: prev.damage_deduction || 0,
            special_allowance_addition: prev.special_allowance_addition || 0,
            other_earnings: prev.other_earnings || 0,
            remarks: prev.remarks ? `Copied from ${prevMonth}` : ""
          });
          copiedCount++;
        }
      }
      db.logAudit("Payroll Inputs Copied", `Copied variable payroll inputs from ${prevMonth} to ${month} for ${copiedCount} employees`, getOperator(req));
      res.json({ success: true, copiedCount, slips: db.getPayslipsByMonth(month, company) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/payroll-masters", async (req, res) => {
    try {
      const defaultEarnings = [
        { id: "E1", code: "BASIC", name: "Basic Salary", category: "STATUTORY", status: "ACTIVE" },
        { id: "E2", code: "HRA", name: "House Rent Allowance", category: "STATUTORY", status: "ACTIVE" },
        { id: "E3", code: "SPECIAL", name: "Special Allowance", category: "RECURRING", status: "ACTIVE" },
        { id: "E4", code: "BONUS", name: "Bonus Incentive", category: "VARIABLE", status: "ACTIVE" },
        { id: "E5", code: "PERF_INC", name: "Performance Incentive", category: "VARIABLE", status: "ACTIVE" },
        { id: "E6", code: "ATT_INC", name: "Attendance Incentive", category: "VARIABLE", status: "ACTIVE" },
        { id: "E7", code: "PROD_INC", name: "Production Incentive", category: "VARIABLE", status: "ACTIVE" },
        { id: "E8", code: "REIMB", name: "Reimbursement", category: "VARIABLE", status: "ACTIVE" },
        { id: "E9", code: "ARREAR", name: "Arrear Payment", category: "VARIABLE", status: "ACTIVE" }
      ];
      const defaultDeductions = [
        { id: "D1", code: "PF", name: "Provident Fund (PF)", category: "STATUTORY", status: "ACTIVE" },
        { id: "D2", code: "ESIC", name: "Employee State Insurance (ESIC)", category: "STATUTORY", status: "ACTIVE" },
        { id: "D3", code: "PT", name: "Professional Tax (PT)", category: "STATUTORY", status: "ACTIVE" },
        { id: "D4", code: "TDS", name: "Tax Deducted at Source (TDS)", category: "TAX", status: "ACTIVE" },
        { id: "D5", code: "LOAN", name: "Loan EMI Recovery", category: "RECOVERY", status: "ACTIVE" },
        { id: "D6", code: "ADVANCE", name: "Salary Advance Recovery", category: "RECOVERY", status: "ACTIVE" },
        { id: "D7", code: "CANTEEN", name: "Canteen Charges Recovery", category: "RECOVERY", status: "ACTIVE" },
        { id: "D8", code: "UNIFORM", name: "Uniform Charges Recovery", category: "RECOVERY", status: "ACTIVE" },
        { id: "D9", code: "NOTICE", name: "Notice Period Recovery", category: "RECOVERY", status: "ACTIVE" },
        { id: "D10", code: "MOBILE", name: "Mobile Charges Recovery", category: "RECOVERY", status: "ACTIVE" },
        { id: "D11", code: "DAMAGE", name: "Damage Recovery", category: "RECOVERY", status: "ACTIVE" },
        { id: "D12", code: "OTHER", name: "Other Deductions", category: "OTHER", status: "ACTIVE" }
      ];
      const earningsStr = await db.getSystemSetting("payroll_earning_heads", JSON.stringify(defaultEarnings));
      const deductionsStr = await db.getSystemSetting("payroll_deduction_heads", JSON.stringify(defaultDeductions));
      res.json({
        earningHeads: JSON.parse(earningsStr),
        deductionHeads: JSON.parse(deductionsStr)
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/payroll-masters", async (req, res) => {
    try {
      const { earningHeads, deductionHeads } = req.body;
      if (earningHeads) {
        await db.setSystemSetting("payroll_earning_heads", JSON.stringify(earningHeads));
      }
      if (deductionHeads) {
        await db.setSystemSetting("payroll_deduction_heads", JSON.stringify(deductionHeads));
      }
      db.logAudit("Payroll Masters Updated", "Updated Master Earning and Deduction Heads configuration", getOperator(req));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/payroll-runs/calculate", (req, res) => {
    try {
      const { month, company } = req.body;
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ error: "Month (YYYY-MM) is required" });
      }
      if (db.isPayrollLocked(month, company)) {
        return res.status(400).json({ error: "Payroll month is locked. Unlock it first before recalculating." });
      }
      const newRun = db.runPayroll(month, company);
      db.logAudit("Payroll Processed", `Calculated and generated draft payroll wages for month ${month} (${company || "ALL"})`, getOperator(req));
      res.json({ success: true, run: newRun, slips: db.getPayslipsByMonth(month, company) });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/payroll-runs/close", async (req, res) => {
    try {
      const { month, company, action } = req.body;
      if (!month) return res.status(400).json({ error: "Month is required" });
      if (action === "unlock") {
        const suffix = company && company !== "ALL" ? `-${company}` : "";
        const run = db.data.payroll_runs.find((r) => r.month === month && r.id === `RUN-${month}${suffix}`);
        if (!run) return res.status(404).json({ error: "Payroll run not found" });
        run.status = "DRAFT";
        db.dbSqlite.run(`UPDATE payroll_runs SET status = 'DRAFT' WHERE id = ?`, [run.id]);
        await db.persistDataSync();
        db.logAudit("Payroll Unlocked", `Unlocked payroll for ${month} (${company || "ALL"})`, getOperator(req));
        return res.json({ success: true });
      }
      const success = db.closePayroll(month, company);
      if (!success) {
        return res.status(404).json({ error: "Payroll run draft not found" });
      }
      await db.persistDataSync();
      db.logAudit("Payroll Approved", `Approved and locked payroll month ledger for ${month} (${company || "ALL"})`, getOperator(req));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/payroll-runs/pay", (req, res) => {
    try {
      const { month, company, paymentDate } = req.body;
      if (!month) return res.status(400).json({ error: "Month is required" });
      const result = db.payPayslips(month, company, paymentDate);
      db.logAudit("Payroll Paid", `Disbursed and sent salary notifications to ${result.count} employees for month ${month} (${company || "ALL"})`, getOperator(req));
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/payslips/:id/mark-paid", (req, res) => {
    try {
      const { id } = req.params;
      const { paymentDate } = req.body;
      if (!id) return res.status(400).json({ error: "Payslip ID required" });
      const payDate = paymentDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      db.markPayslipPaid(id, payDate);
      db.logAudit("Salary Paid", `Marked payslip ${id} as PAID on ${payDate}`, getOperator(req));
      res.json({ success: true, payslipId: id, paymentDate: payDate });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/payslips/mark-all-paid", async (req, res) => {
    try {
      const { month, company } = req.body;
      const payDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      let count = 0;
      db.data.payslips.forEach((p) => {
        if (p.month === month && (p.payment_status || "PENDING") !== "PAID") {
          if (!company || company === "ALL" || company === "GROUP") {
            p.payment_status = "PAID";
            p.payment_date = payDate;
            count++;
          }
        }
      });
      await db.persistDataSync();
      db.logAudit("Bulk Salary Paid", `Marked ${count} payslips as PAID for month ${month}`, getOperator(req));
      res.json({ success: true, count, paymentDate: payDate });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/daily-attendance/mark-all-present", (req, res) => {
    try {
      const { date, company } = req.body;
      if (!date) return res.status(400).json({ error: "Date required" });
      const employees = db.getEmployees().filter(
        (e) => e.status === "ACTIVE" && (company === "ALL" || !company || e.company === company)
      );
      const month = date.substring(0, 7);
      const results = [];
      for (const emp of employees) {
        const existing = db.getAttendanceByEmployeeAndMonth(emp.id, month);
        let att = existing.find((a) => a.employee_id === emp.id);
        if (!att) {
          att = {
            id: `ATT-${emp.id}-${month}`,
            employee_id: emp.id,
            month,
            total_days: 0,
            working_days: 0,
            lop_days: 0,
            overtime_hours: 0,
            present: 0,
            absent: 0,
            weekly_off: 0,
            paid_holiday: 0,
            leave: 0,
            lwp: 0,
            is_locked: false
          };
        }
        att.present = (att.present || 0) + 1;
        att.working_days = (att.present || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + (att.leave || 0);
        db.upsertAttendance(att);
        results.push({ employee_id: emp.id, name: emp.name, status: "PRESENT" });
      }
      db.logAudit("Daily Attendance", `Marked ${results.length} employees as PRESENT for ${date}`, getOperator(req));
      res.json({ success: true, count: results.length, date, results });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/daily-attendance/mark-employee", (req, res) => {
    try {
      const { employeeId, date, status, halfDay } = req.body;
      if (!employeeId || !date || !status) {
        return res.status(400).json({ error: "employeeId, date, and status required" });
      }
      const month = date.substring(0, 7);
      const existing = db.getAttendanceByEmployeeAndMonth(employeeId, month);
      let att = existing.find((a) => a.employee_id === employeeId);
      if (!att) {
        att = {
          id: `ATT-${employeeId}-${month}`,
          employee_id: employeeId,
          month,
          total_days: 0,
          working_days: 0,
          lop_days: 0,
          overtime_hours: 0,
          present: 0,
          absent: 0,
          weekly_off: 0,
          paid_holiday: 0,
          leave: 0,
          lwp: 0,
          is_locked: false
        };
      }
      if (status === "PRESENT") {
        att.present = (att.present || 0) + 1;
        if (halfDay) att.lop_days = (att.lop_days || 0) + 0.5;
      } else if (status === "ABSENT") {
        att.absent = (att.absent || 0) + 1;
        att.lop_days = (att.absent || 0) + (att.lwp || 0);
      } else if (status === "LEAVE") {
        att.leave = (att.leave || 0) + 1;
      } else if (status === "REMOVE") {
        if ((att.present || 0) > 0) att.present = (att.present || 0) - 1;
        else if ((att.absent || 0) > 0) att.absent = (att.absent || 0) - 1;
        else if ((att.leave || 0) > 0) att.leave = (att.leave || 0) - 1;
      }
      att.working_days = (att.present || 0) + (att.weekly_off || 0) + (att.paid_holiday || 0) + (att.leave || 0);
      att.lop_days = (att.absent || 0) + (att.lwp || 0);
      db.upsertAttendance(att);
      db.logAudit("Daily Attendance", `Updated ${employeeId} as ${status} for ${date}`, getOperator(req));
      res.json({ success: true, employeeId, status, date });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/daily-attendance/summary", (req, res) => {
    try {
      const { date, company } = req.query;
      if (!date) return res.status(400).json({ error: "Date required" });
      const month = date.substring(0, 7);
      const employees = db.getEmployees().filter(
        (e) => e.status === "ACTIVE" && (company === "ALL" || !company || e.company === company)
      );
      const summary = employees.map((emp) => {
        const att = db.getAttendanceByEmployeeAndMonth(emp.id, month).find((a) => a.employee_id === emp.id);
        return {
          employee_id: emp.id,
          name: emp.name,
          company: emp.company,
          present: att?.present || 0,
          absent: att?.absent || 0,
          leave: att?.leave || 0,
          halfDay: (att?.lop_days || 0) % 1 !== 0
        };
      });
      res.json({ success: true, date, summary });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/excel/export/pf/:month", (req, res) => {
    const { month } = req.params;
    const { company } = req.query;
    const slips = db.getPayslipsByMonth(month, company);
    if (slips.length === 0) {
      return res.status(404).send("No slips found for PF challan export");
    }
    const headers = ["UAN", "Member Name", "Gross Wages", "EPF Wages", "EPS Wages", "EDLI Wages", "EPF Contrib Employee", "EPS Contrib Employer", "EPF Diff Contrib", "NCP/unpaid Days"];
    const lines = [headers.join(",")];
    for (const s of slips) {
      const emp = db.getEmployeeById(s.employee_id);
      if (!emp || !emp.pf_opt_in) continue;
      const uan = emp.uan || "100XXXXXXXXX";
      const epmWages = Math.min(15e3, s.earned_base_salary + s.earned_da);
      const epfContributionEmployee = Math.round(epmWages * 0.12);
      const epsContributionEmployer = Math.round(epmWages * 0.0833);
      const epfDiffContributionEmployer = Math.round(epmWages * 0.0367);
      const row = [
        uan,
        s.employee_name,
        s.gross_salary,
        epmWages,
        epmWages,
        epmWages,
        epfContributionEmployee,
        epsContributionEmployer,
        epfDiffContributionEmployer,
        s.lop_deduction > 0 ? 3 : 0
        // sample NCP days
      ];
      lines.push(row.join(","));
    }
    const csvContent = lines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="EPF_ECR_Challan_${month}_${company || "ALL"}.csv"`);
    res.send(csvContent);
  });
  app.get("/api/excel/export/payroll/:month", (req, res) => {
    const { month } = req.params;
    const { company } = req.query;
    const slips = db.getPayslipsByMonth(month, company);
    if (slips.length === 0) {
      return res.status(404).send("No payroll slips found for " + month);
    }
    const headers = [
      "Slip ID",
      "Employee ID",
      "Employee Name",
      "Company Name",
      "Department",
      "Designation",
      "Basic Wage Rate",
      "Calendar Days",
      "Paid Days",
      "Earned Basic",
      "Earned HRA",
      "Earned Education Allowance",
      "Earned Medical Allowance",
      "Earned Conveyance Allowance",
      "Special Allowance",
      "Gross Salary Earned",
      "Loss of Pay (LOP) Deduction",
      "Employee Provident Fund (EPF)",
      "ESIC Deduction",
      "Professional Tax (PT)",
      "TDS Tax",
      "Total Deductions",
      "Net Salary Disbursed",
      "Employer PF Share",
      "Employer ESIC Share",
      "Bank Name",
      "Bank Account Number",
      "Bank IFSC Code"
    ];
    const lines = [headers.join(",")];
    for (const s of slips) {
      const emp = db.getEmployeeById(s.employee_id);
      const row = [
        s.id,
        s.employee_id,
        `"${s.employee_name.replace(/"/g, '""')}"`,
        `"${emp?.company || "SVN-1"}"`,
        `"${s.department}"`,
        `"${s.designation}"`,
        s.calendar_days || 30,
        s.pay_days ?? "-",
        s.rate_base_salary,
        s.earned_base_salary,
        s.earned_hra,
        s.earned_edu_allowance || 0,
        s.earned_medical_allowance || 0,
        s.earned_conveyance_allowance || 0,
        s.earned_special_allowance,
        s.gross_salary,
        s.lop_deduction,
        s.pf_deduction,
        s.esic_deduction,
        s.professional_tax,
        s.tds,
        s.total_deductions,
        s.net_salary,
        s.employer_pf,
        s.employer_esic,
        `"${s.bank_name}"`,
        `"${s.bank_account}"`,
        `"${s.ifsc}"`
      ];
      lines.push(row.join(","));
    }
    const csvContent = lines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="Vetan_Payroll_Register_${month}_${company || "ALL"}.csv"`);
    res.send(csvContent);
  });
  app.get("/api/excel/export/bank/:month", (req, res) => {
    const { month } = req.params;
    const { company } = req.query;
    const slips = db.getPayslipsByMonth(month, company);
    if (slips.length === 0) {
      return res.status(404).send("No processed slips found for bank transfer export");
    }
    const headers = ["Beneficiary Bank Name", "Beneficiary Account Number", "Beneficiary IFSC Code", "Beneficiary Name", "Payment Amount", "Transaction Remarks", "Corporate Account Entity"];
    const lines = [headers.join(",")];
    for (const s of slips) {
      const emp = db.getEmployeeById(s.employee_id);
      const row = [
        `"${s.bank_name}"`,
        `"${s.bank_account}"`,
        `"${s.ifsc}"`,
        `"${s.employee_name.replace(/"/g, '""')}"`,
        s.net_salary,
        `"Salary for ${month}"`,
        `"${emp?.company || "SVN-1"}"`
      ];
      lines.push(row.join(","));
    }
    const csvContent = lines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="Vetan_BankTransfer_Format_${month}_${company || "ALL"}.csv"`);
    res.send(csvContent);
  });
  app.get("/api/excel/export/bank/hdfc/:month", (req, res) => {
    const { month } = req.params;
    const { company, format } = req.query;
    const slips = db.getPayslipsByMonth(month, company);
    if (slips.length === 0) {
      return res.status(404).send("No processed slips found for HDFC salary upload");
    }
    const headers = [
      "Beneficiary Account No",
      "Transaction Amount",
      "Beneficiary Name",
      "Bank IFSC",
      "Email ID",
      "Phone Number",
      "Narration",
      "Source Corporate Account"
    ];
    const lines = [headers.join(",")];
    for (const s of slips) {
      const emp = db.getEmployeeById(s.employee_id);
      let sourceAccount = "50200008912345";
      if (emp?.company?.includes("SVN")) sourceAccount = "50200008912345";
      if (emp?.company?.includes("Sakar")) sourceAccount = "50200008999887";
      const row = [
        `"${s.bank_account}"`,
        s.net_salary,
        `"${s.employee_name.replace(/"/g, '""')}"`,
        `"${s.ifsc}"`,
        `"${emp?.email || ""}"`,
        `"${emp?.phone || ""}"`,
        `"SALARY FOR ${month}"`,
        `"${sourceAccount}"`
      ];
      lines.push(row.join(","));
    }
    const fileContent = lines.join("\n");
    const ext = format === "excel" ? "xls" : "csv";
    const contentType = format === "excel" ? "application/vnd.ms-excel" : "text/csv";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="HDFC_Salary_Upload_${month}_${company || "ALL"}.${ext}"`);
    res.send(fileContent);
  });
  app.post("/api/excel/import/employees", (req, res) => {
    try {
      const { csvText, companyFilter } = req.body;
      if (!csvText || typeof csvText !== "string") {
        return res.status(400).json({ error: "Please paste a valid CSV representation" });
      }
      const parseCleanFloat = (val) => {
        if (val === void 0 || val === null) return 0;
        const cleaned = String(val).replace(/,/g, "").replace(/\s+/g, "").trim();
        if (cleaned === "" || cleaned === "-" || cleaned === "\u2014" || cleaned === "\u2013") return 0;
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      };
      const parseCleanInt = (val) => {
        if (val === void 0 || val === null) return 0;
        const cleaned = String(val).replace(/,/g, "").replace(/\s+/g, "").trim();
        if (cleaned === "" || cleaned === "-" || cleaned === "\u2014" || cleaned === "\u2013") return 0;
        const num = parseInt(cleaned, 10);
        return isNaN(num) ? 0 : num;
      };
      const parseCleanDate = (val) => {
        if (!val) return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const str = String(val).trim();
        if (!str || str === "-" || str === "\u2014" || str === "N/A" || str === "n/a") return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          return str;
        }
        const mmmRegex = /^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{2,4})$/;
        const match = str.match(mmmRegex);
        if (match) {
          const day = match[1].padStart(2, "0");
          const mmm = match[2].toLowerCase();
          const yearStr = match[3];
          let year = parseInt(yearStr, 10);
          if (yearStr.length === 2) {
            year = year < 70 ? 2e3 + year : 1900 + year;
          }
          const months = {
            jan: "01",
            feb: "02",
            mar: "03",
            apr: "04",
            may: "05",
            jun: "06",
            jul: "07",
            aug: "08",
            sep: "09",
            oct: "10",
            nov: "11",
            dec: "12"
          };
          const month = months[mmm];
          if (month) {
            return `${year}-${month}-${day}`;
          }
        }
        const dmyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/;
        const matchDmy = str.match(dmyRegex);
        if (matchDmy) {
          const day = matchDmy[1].padStart(2, "0");
          const month = matchDmy[2].padStart(2, "0");
          const yearStr = matchDmy[3];
          let year = parseInt(yearStr, 10);
          if (yearStr.length === 2) {
            year = year < 70 ? 2e3 + year : 1900 + year;
          }
          return `${year}-${month}-${day}`;
        }
        try {
          const d = new Date(str);
          if (!isNaN(d.getTime())) {
            return d.toISOString().split("T")[0];
          }
        } catch (e) {
        }
        return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      };
      const cleanCsvText = csvText.replace(/\r/g, "").trim();
      const lines = cleanCsvText.split("\n");
      const rows = [];
      for (const line of lines) {
        if (!line.trim()) continue;
        const cells = [];
        let currentCell = "";
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === "," && !inQuotes) {
            cells.push(currentCell.trim());
            currentCell = "";
          } else {
            currentCell += char;
          }
        }
        cells.push(currentCell.trim());
        const parsedCells = cells.map((cell) => {
          if (cell.startsWith('"') && cell.endsWith('"')) {
            return cell.slice(1, -1).trim();
          }
          return cell;
        });
        rows.push(parsedCells);
      }
      if (rows.length < 2) {
        return res.status(400).json({ error: "Pasted layout is empty or has no record rows" });
      }
      const header = rows[0].map((h) => h.toLowerCase().replace(/[\s_-]+/g, ""));
      const idxId = header.indexOf("employeecode") !== -1 ? header.indexOf("employeecode") : header.indexOf("empcode") !== -1 ? header.indexOf("empcode") : header.indexOf("employeeid") !== -1 ? header.indexOf("employeeid") : header.indexOf("code") !== -1 ? header.indexOf("code") : header.indexOf("id") !== -1 ? header.indexOf("id") : -1;
      if (idxId === -1) {
        return res.status(400).json({ error: 'Pasted spreadsheet headers must contain an "Employee Code" or "Emp Code" column as the mandatory matching field.' });
      }
      const idxName = header.indexOf("name");
      const idxDesignation = header.indexOf("designation") !== -1 ? header.indexOf("designation") : header.indexOf("role");
      const idxDepartment = header.indexOf("department") !== -1 ? header.indexOf("department") : header.indexOf("dept");
      const idxBase = header.indexOf("basesalary") !== -1 ? header.indexOf("basesalary") : header.indexOf("salary");
      const idxEmail = header.indexOf("email");
      const idxPhone = header.indexOf("phone") !== -1 ? header.indexOf("phone") : header.indexOf("mobile");
      const idxBank = header.indexOf("bank");
      const idxAccount = header.indexOf("account") !== -1 ? header.indexOf("account") : header.indexOf("bankaccount");
      const idxIfsc = header.indexOf("ifsc");
      const idxPan = header.indexOf("pan") !== -1 ? header.indexOf("pan") : header.indexOf("pancard");
      const idxQualification = header.indexOf("qualification");
      const idxLocation = header.indexOf("location") !== -1 ? header.indexOf("location") : header.indexOf("worklocation") !== -1 ? header.indexOf("worklocation") : header.indexOf("officelocation");
      const idxVehicle = header.indexOf("vehicledetail") !== -1 ? header.indexOf("vehicledetail") : header.indexOf("vehicle");
      const idxPrevCompany = header.indexOf("prevcompanyname") !== -1 ? header.indexOf("prevcompanyname") : header.indexOf("prevcompany") !== -1 ? header.indexOf("prevcompany") : header.indexOf("previouscompany");
      const idxPrevLoc = header.indexOf("prevcompanylocation") !== -1 ? header.indexOf("prevcompanylocation") : header.indexOf("previouscompanylocation");
      const idxExp = header.indexOf("totalexperience") !== -1 ? header.indexOf("totalexperience") : header.indexOf("experience") !== -1 ? header.indexOf("experience") : header.indexOf("priorexperience");
      const idxBirthYear = header.indexOf("birthyear") !== -1 ? header.indexOf("birthyear") : header.indexOf("birth_year") !== -1 ? header.indexOf("birth_year") : header.indexOf("yearofbirth");
      const idxCategory = header.indexOf("employeecategory") !== -1 ? header.indexOf("employeecategory") : header.indexOf("category") !== -1 ? header.indexOf("category") : header.indexOf("type") !== -1 ? header.indexOf("type") : header.indexOf("employeetype") !== -1 ? header.indexOf("employeetype") : -1;
      const idxReportingManager = header.indexOf("reportingmanager") !== -1 ? header.indexOf("reportingmanager") : header.indexOf("reporting_manager") !== -1 ? header.indexOf("reporting_manager") : header.indexOf("manager");
      const idxReportingHod = header.indexOf("reportinghod") !== -1 ? header.indexOf("reportinghod") : header.indexOf("reporting_hod") !== -1 ? header.indexOf("reporting_hod") : header.indexOf("hod");
      const idxReportingHodName = header.indexOf("reportinghodname") !== -1 ? header.indexOf("reportinghodname") : header.indexOf("reporting_hod_name") !== -1 ? header.indexOf("reporting_hod_name") : header.indexOf("hodname");
      const idxJoiningDate = header.indexOf("joiningdate") !== -1 ? header.indexOf("joiningdate") : header.indexOf("dateofjoining") !== -1 ? header.indexOf("dateofjoining") : header.indexOf("doj");
      const idxExitDate = header.indexOf("exitdate") !== -1 ? header.indexOf("exitdate") : header.indexOf("dateofleaving") !== -1 ? header.indexOf("dateofleaving") : header.indexOf("leavingdate") !== -1 ? header.indexOf("leavingdate") : header.indexOf("dol");
      const idxHra = header.indexOf("hra") !== -1 ? header.indexOf("hra") : header.indexOf("houserentallowance");
      const idxConveyance = header.indexOf("conall") !== -1 ? header.indexOf("conall") : header.indexOf("conveyanceallowance") !== -1 ? header.indexOf("conveyanceallowance") : header.indexOf("conveyance");
      const idxEdu = header.indexOf("childall") !== -1 ? header.indexOf("childall") : header.indexOf("eduallowance") !== -1 ? header.indexOf("eduallowance") : header.indexOf("childallowance");
      const idxMedical = header.indexOf("medicalall") !== -1 ? header.indexOf("medicalall") : header.indexOf("medicalallowance") !== -1 ? header.indexOf("medicalallowance") : header.indexOf("medical");
      const idxSpecial = header.indexOf("specialall") !== -1 ? header.indexOf("specialall") : header.indexOf("specialallowance") !== -1 ? header.indexOf("specialallowance") : header.indexOf("special");
      const idxDa = header.indexOf("dearnesall") !== -1 ? header.indexOf("dearnesall") : header.indexOf("da") !== -1 ? header.indexOf("da") : header.indexOf("dearnessallowance");
      const idxBonus = header.indexOf("bonuspayable") !== -1 ? header.indexOf("bonuspayable") : header.indexOf("bonus");
      const idxCtc = header.indexOf("ctc") !== -1 ? header.indexOf("ctc") : header.indexOf("ctcsalary");
      if (idxName === -1 || idxDesignation === -1 || idxBase === -1) {
        return res.status(400).json({ error: 'Headers must contain at least "Employee Code", "Name", "Designation" and "Base Salary".' });
      }
      let importedCount = 0;
      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (r.length < 2 || !r[idxName]) continue;
        const empCode = r[idxId] ? r[idxId].trim() : "";
        if (!empCode) continue;
        const base = parseCleanInt(r[idxBase]) || 15e3;
        const birthYearVal = idxBirthYear !== -1 && r[idxBirthYear] ? parseCleanInt(r[idxBirthYear]) || 1995 : 1995;
        const parsedHra = idxHra !== -1 && r[idxHra] !== void 0 && r[idxHra] !== "" ? Math.round(parseCleanFloat(r[idxHra])) : Math.round(base * 0.4);
        const parsedSpecial = idxSpecial !== -1 && r[idxSpecial] !== void 0 && r[idxSpecial] !== "" ? Math.round(parseCleanFloat(r[idxSpecial])) : Math.round(base * 0.15);
        const parsedDa = idxDa !== -1 && r[idxDa] !== void 0 && r[idxDa] !== "" ? Math.round(parseCleanFloat(r[idxDa])) : Math.round(base * 0.1);
        const parsedConveyance = idxConveyance !== -1 && r[idxConveyance] !== void 0 && r[idxConveyance] !== "" ? Math.round(parseCleanFloat(r[idxConveyance])) : 0;
        const parsedEdu = idxEdu !== -1 && r[idxEdu] !== void 0 && r[idxEdu] !== "" ? Math.round(parseCleanFloat(r[idxEdu])) : 0;
        const parsedMedical = idxMedical !== -1 && r[idxMedical] !== void 0 && r[idxMedical] !== "" ? Math.round(parseCleanFloat(r[idxMedical])) : 0;
        const parsedBonus = idxBonus !== -1 && r[idxBonus] !== void 0 && r[idxBonus] !== "" ? Math.round(parseCleanFloat(r[idxBonus])) : 0;
        const grossSalary = base + parsedHra + parsedSpecial + parsedDa + parsedConveyance + parsedEdu + parsedMedical;
        const parsedPfOptIn = true;
        const empPf = Math.round((base + parsedDa) * 0.12);
        const employerPf = empPf;
        const parsedEsicOptIn = grossSalary <= 21e3;
        const employerEsic = parsedEsicOptIn ? Math.round(grossSalary * 0.0325) : 0;
        const parsedCtc = grossSalary + employerPf + employerEsic + parsedBonus;
        const parsedJoiningDate = parseCleanDate(idxJoiningDate !== -1 ? r[idxJoiningDate] : void 0);
        const parsedExitDate = idxExitDate !== -1 && r[idxExitDate] !== void 0 && r[idxExitDate] !== "" && r[idxExitDate] !== "-" ? parseCleanDate(r[idxExitDate]) : void 0;
        const existingEmp = db.getEmployeeById(empCode);
        if (existingEmp) {
          db.updateEmployee(empCode, {
            name: r[idxName],
            designation: r[idxDesignation],
            department: idxDepartment !== -1 ? r[idxDepartment] : existingEmp.department,
            email: idxEmail !== -1 ? r[idxEmail] : existingEmp.email,
            phone: idxPhone !== -1 ? r[idxPhone] : existingEmp.phone,
            birth_year: birthYearVal,
            joining_date: parsedJoiningDate,
            exit_date: parsedExitDate,
            status: parsedExitDate ? "RESIGNED" : "ACTIVE",
            bank_name: idxBank !== -1 ? r[idxBank] : existingEmp.bank_name,
            bank_account: idxAccount !== -1 ? r[idxAccount] : existingEmp.bank_account,
            ifsc: idxIfsc !== -1 ? r[idxIfsc] : existingEmp.ifsc,
            pan: idxPan !== -1 ? r[idxPan] : existingEmp.pan,
            base_salary: base,
            hra: parsedHra,
            special_allowance: parsedSpecial,
            da: parsedDa,
            conveyance_allowance: parsedConveyance,
            edu_allowance: parsedEdu,
            medical_allowance: parsedMedical,
            bonus_payable: parsedBonus,
            ctc_salary: parsedCtc,
            salary_structure_type: "FIXED",
            qualification: idxQualification !== -1 ? r[idxQualification] : existingEmp.qualification,
            location: idxLocation !== -1 ? r[idxLocation] : existingEmp.location,
            vehicle_detail: idxVehicle !== -1 ? r[idxVehicle] : existingEmp.vehicle_detail,
            prev_company_name: idxPrevCompany !== -1 ? r[idxPrevCompany] : existingEmp.prev_company_name,
            prev_company_location: idxPrevLoc !== -1 ? r[idxPrevLoc] : existingEmp.prev_company_location,
            total_experience: idxExp !== -1 ? r[idxExp] : existingEmp.total_experience,
            reporting_manager: idxReportingManager !== -1 && r[idxReportingManager] ? r[idxReportingManager] : existingEmp.reporting_manager,
            reporting_hod: idxReportingHod !== -1 && r[idxReportingHod] ? r[idxReportingHod] : existingEmp.reporting_hod,
            reporting_hod_name: idxReportingHodName !== -1 && r[idxReportingHodName] ? r[idxReportingHodName] : existingEmp.reporting_hod_name,
            employee_category: idxCategory !== -1 && r[idxCategory] ? r[idxCategory].toLowerCase().includes("worker") || r[idxCategory].toLowerCase().includes("employee") ? "Worker" : r[idxCategory].toLowerCase().includes("contract") ? "Contract" : "Staff" : existingEmp.employee_category
          });
        } else {
          const newEmp = {
            id: empCode,
            name: r[idxName],
            company: companyFilter || "SVN-1",
            designation: r[idxDesignation],
            department: idxDepartment !== -1 ? r[idxDepartment] : "Engineering",
            email: idxEmail !== -1 ? r[idxEmail] : `${r[idxName].toLowerCase().replace(/\s+/g, "")}@sakarelectricals.com`,
            phone: idxPhone !== -1 ? r[idxPhone] : "9999900000",
            birth_year: birthYearVal,
            needs_password_change: true,
            joining_date: parsedJoiningDate,
            exit_date: parsedExitDate,
            status: parsedExitDate ? "RESIGNED" : "ACTIVE",
            bank_name: idxBank !== -1 ? r[idxBank] : "HDFC Bank",
            bank_account: idxAccount !== -1 ? r[idxAccount] : "501004" + Math.floor(Math.random() * 1e9),
            ifsc: idxIfsc !== -1 ? r[idxIfsc] : "HDFC0000124",
            pan: idxPan !== -1 ? r[idxPan] : "ABCDE" + Math.floor(Math.random() * 1e4) + "F",
            uan: "100" + Math.floor(Math.random() * 1e9),
            base_salary: base,
            hra: parsedHra,
            special_allowance: parsedSpecial,
            da: parsedDa,
            conveyance_allowance: parsedConveyance,
            edu_allowance: parsedEdu,
            medical_allowance: parsedMedical,
            bonus_payable: parsedBonus,
            ctc_salary: parsedCtc,
            salary_structure_type: "FIXED",
            pf_opt_in: parsedPfOptIn,
            esic_opt_in: parsedEsicOptIn,
            professional_tax_opt_in: true,
            leave_balance_pl: 18,
            leave_balance_cl: 6,
            leave_balance_sl: 6,
            qualification: idxQualification !== -1 ? r[idxQualification] : "B.Tech (Electrical Engineering)",
            location: idxLocation !== -1 ? r[idxLocation] : "Sakar Corporate Tower, Alkapuri",
            vehicle_detail: idxVehicle !== -1 ? r[idxVehicle] : "GJ-06-HM-1234 (Honda Activa)",
            prev_company_name: idxPrevCompany !== -1 ? r[idxPrevCompany] : "L&T Heavy Engineering",
            prev_company_location: idxPrevLoc !== -1 ? r[idxPrevLoc] : "Vadodara, Gujarat",
            total_experience: idxExp !== -1 ? r[idxExp] : "4 Years",
            reporting_manager: idxReportingManager !== -1 && r[idxReportingManager] ? r[idxReportingManager] : "Management",
            reporting_hod: idxReportingHod !== -1 && r[idxReportingHod] ? r[idxReportingHod] : void 0,
            reporting_hod_name: idxReportingHodName !== -1 && r[idxReportingHodName] ? r[idxReportingHodName] : idxReportingHod !== -1 && r[idxReportingHod] ? r[idxReportingHod] : void 0,
            employee_category: idxCategory !== -1 && r[idxCategory] ? r[idxCategory].toLowerCase().includes("worker") || r[idxCategory].toLowerCase().includes("employee") ? "Worker" : r[idxCategory].toLowerCase().includes("contract") ? "Contract" : "Staff" : "Staff"
          };
          db.insertEmployee(newEmp);
        }
        importedCount++;
      }
      res.json({ success: true, count: importedCount });
    } catch (e) {
      res.status(500).json({ error: "Spreadsheet import failed: " + e.message });
    }
  });
  const getOperator = (req) => {
    return req.headers["x-operator-name"] || req.body.operator || "Admin";
  };
  const getOperatorRole = (req) => {
    return req.headers["x-operator-role"] || "COMPANY_HR";
  };
  app.get("/api/gate-passes", (req, res) => {
    try {
      const { company } = req.query;
      const allowed = getAllowedCompanies(req);
      let passes = db.getGatePasses();
      if (allowed) {
        if (company && company !== "ALL") {
          if (!allowed.includes(company)) {
            return res.json([]);
          }
          passes = passes.filter((g) => g.company === company || g.target_company === company);
        } else {
          passes = passes.filter((g) => allowed.includes(g.company) || allowed.includes(g.target_company));
        }
      } else if (company && company !== "ALL") {
        passes = passes.filter((g) => g.company === company || g.target_company === company);
      }
      res.json(passes);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/gate-passes", (req, res) => {
    try {
      const pass = req.body;
      const saved = db.addGatePass(pass);
      db.logAudit("Gate Pass Created", `Created gate pass ${saved.id} for ${saved.employee_name} (${saved.employee_id}) to ${saved.target_company}`, getOperator(req));
      res.json({ success: true, gatePass: saved });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.put("/api/gate-passes/:id", (req, res) => {
    try {
      const { id } = req.params;
      const { status, details } = req.body;
      const success = db.updateGatePassStatus(id, status, details);
      if (success) {
        db.logAudit("Gate Pass Updated", `Updated gate pass ${id} status to ${status}`, getOperator(req));
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Gate pass not found" });
      }
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/audit-logs", (req, res) => {
    db.getAuditLogs().then((logs) => res.json(logs)).catch((e) => res.status(500).json({ error: e.message }));
  });
  app.post("/api/payroll-runs/unlock", async (req, res) => {
    try {
      const { month, company, pin } = req.body;
      const operatorRole = getOperatorRole(req);
      const operatorName = getOperator(req);
      if (operatorRole !== "SUPER_HR") {
        return res.status(403).json({ error: "Access Denied: Only Super Admin can unlock payroll month." });
      }
      if (!await verifyPin(pin)) {
        return res.status(403).json({ error: "PIN_INVALID", message: "Invalid or missing Super Admin Security PIN." });
      }
      const success = db.unlockPayroll(month, company);
      if (!success) {
        return res.status(404).json({ error: "Payroll run not found" });
      }
      await db.persistDataSync();
      db.logAudit("Payroll Unlocked", `Unlocked payroll run for month ${month} (${company || "ALL"})`, operatorName);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/assets", (req, res) => {
    try {
      const { employee_id } = req.query;
      res.json(db.getAssets(employee_id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/assets", (req, res) => {
    try {
      const asset = req.body;
      if (!asset.id) {
        asset.id = "AST-" + Math.random().toString(36).substring(2, 11).toUpperCase();
      }
      db.saveAsset(asset);
      db.logAudit("Save Asset", `Saved asset ${asset.asset_name} (${asset.serial_number}) for employee ${asset.employee_name}`, getOperator(req));
      res.json({ success: true, asset });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/assets/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.deleteAsset(id);
      db.logAudit("Delete Asset", `Deleted asset ID ${id}`, getOperator(req));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/travel", (req, res) => {
    try {
      const { employee_id } = req.query;
      res.json(db.getTravelReimbursements(employee_id));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/travel", (req, res) => {
    try {
      const reimb = req.body;
      if (!reimb.id) {
        reimb.id = "TRV-" + Math.random().toString(36).substring(2, 11).toUpperCase();
      }
      reimb.amount = Math.round((Number(reimb.fuel_liters) || 0) * (Number(reimb.rate_per_liter) || 0));
      db.saveTravelReimbursement(reimb);
      db.logAudit("Save Travel Reimbursement", `Saved travel reimbursement of INR ${reimb.amount} for employee ${reimb.employee_name}`, getOperator(req));
      res.json({ success: true, travel: reimb });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/travel/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.deleteTravelReimbursement(id);
      db.logAudit("Delete Travel", `Deleted travel reimbursement ID ${id}`, getOperator(req));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/broadcasts", (req, res) => {
    try {
      res.json(db.getBroadcasts());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/broadcasts", (req, res) => {
    try {
      const notice = req.body;
      if (!notice.id) {
        notice.id = "BCST-" + Math.random().toString(36).substring(2, 11).toUpperCase();
      }
      if (!notice.created_at) {
        notice.created_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      db.saveBroadcast(notice);
      db.logAudit("Publish Broadcast", `Published announcement: "${notice.title}" for ${notice.target_type} (${notice.target_value})`, getOperator(req));
      res.json({ success: true, broadcast: notice });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.delete("/api/broadcasts/:id", (req, res) => {
    try {
      const { id } = req.params;
      db.deleteBroadcast(id);
      db.logAudit("Delete Broadcast", `Deleted announcement notice ID ${id}`, getOperator(req));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/admin/purge-employees", async (req, res) => {
    try {
      const pin = req.headers["x-security-pin"] || req.query.pin || req.body.pin;
      if (!await verifyPin(pin)) {
        return res.status(403).json({ error: "PIN_INVALID", message: "Invalid or missing Super Admin Security PIN." });
      }
      await db.purgeEmployees();
      db.logAudit("Database Cleared", "All test/dummy employee data and payroll runs permanently purged to start fresh.", getOperator(req));
      res.json({ success: true, message: "All employees and payroll data have been successfully purged. The system is ready for real accounts." });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/backup", (req, res) => {
    try {
      const dbPath = import_path2.default.join(process.cwd(), "Payroll.db");
      res.download(dbPath, "Payroll.db");
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/backup-json", (req, res) => {
    try {
      const dataObj = db.getFullBackupJSON();
      res.json(dataObj);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/restore-json", async (req, res) => {
    try {
      const backupData = req.body;
      const operatorName = getOperator(req);
      if (!backupData || typeof backupData !== "object") {
        return res.status(400).json({ error: "Invalid or empty backup data payload" });
      }
      await db.restoreFullBackupJSON(backupData);
      db.logAudit("Database JSON Restored", "Database structure and records restored from JSON browser sync", operatorName);
      res.json({ success: true, message: "All employees, attendance sheets, and records restored successfully." });
    } catch (e) {
      res.status(500).json({ error: "Database JSON restore failed: " + e.message });
    }
  });
  app.post("/api/restore", async (req, res) => {
    try {
      const { databaseBase64, pin } = req.body;
      const operatorName = getOperator(req);
      if (!await verifyPin(pin)) {
        return res.status(403).json({ error: "PIN_INVALID", message: "Invalid or missing Super Admin Security PIN." });
      }
      if (!databaseBase64) {
        return res.status(400).json({ error: "Missing databaseBase64 parameter" });
      }
      const buffer = Buffer.from(databaseBase64, "base64");
      await db.close();
      const dbPath = import_path2.default.join(process.cwd(), "Payroll.db");
      import_fs2.default.writeFileSync(dbPath, buffer);
      await db.init();
      db.logAudit("Database Restored", "Database structure restored from Backup file", operatorName);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Database restore failed: " + e.message });
    }
  });
  app.get("/api/accounting/bank-sheet/:month", (req, res) => {
    try {
      const { month } = req.params;
      const { company } = req.query;
      const slips = db.getPayslipsByMonth(month, company);
      if (slips.length === 0) {
        return res.status(404).json({ error: "No payslips found for this month" });
      }
      const headers = [
        "Sr No",
        "Employee Code",
        "Employee Name",
        "Unit",
        "Department",
        "Bank Name",
        "Bank Account No",
        "IFSC Code",
        "Net Salary",
        "Payment Status"
      ];
      const lines = [headers.join(",")];
      let totalNet = 0;
      slips.forEach((s, i) => {
        const emp = db.getEmployeeById(s.employee_id);
        totalNet += s.net_salary || 0;
        const row = [
          i + 1,
          s.employee_id,
          `"${s.employee_name}"`,
          `"${emp?.company || ""}"`,
          `"${emp?.department || ""}"`,
          `"${s.bank_name || ""}"`,
          `"${s.bank_account || ""}"`,
          `"${s.ifsc || ""}"`,
          s.net_salary,
          s.is_paid ? "PAID" : "PENDING"
        ];
        lines.push(row.join(","));
      });
      lines.push("");
      lines.push(`"TOTAL",,,,,,,${totalNet},`);
      const csvContent = lines.join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="Bank_Sheet_${month}_${company || "ALL"}.csv"`);
      res.send(csvContent);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/accounting/head-wise/:month", (req, res) => {
    try {
      const { month } = req.params;
      const { company } = req.query;
      const slips = db.getPayslipsByMonth(month, company);
      if (slips.length === 0) {
        return res.status(404).json({ error: "No payslips found for this month" });
      }
      const headers = [
        "Sr No",
        "Employee Code",
        "Employee Name",
        "Unit",
        "Basic Salary",
        "HRA",
        "DA",
        "Special Allowance",
        "Conveyance",
        "Education",
        "Medical",
        "Gross Salary",
        "PF Employee",
        "ESIC Employee",
        "PT",
        "TDS",
        "Loan EMI",
        "Salary Advance",
        "Other Deduction",
        "LOP Deduction",
        "Total Deductions",
        "Net Salary",
        "PF Employer",
        "ESIC Employer",
        "Bonus Payable"
      ];
      const lines = [headers.join(",")];
      const unitTotals = {};
      let grandTotals = {};
      slips.forEach((s, i) => {
        const emp = db.getEmployeeById(s.employee_id);
        const unit = emp?.company || "Unknown";
        if (!unitTotals[unit]) {
          unitTotals[unit] = {
            count: 0,
            basic: 0,
            hra: 0,
            da: 0,
            special: 0,
            conveyance: 0,
            edu: 0,
            medical: 0,
            gross: 0,
            pf_emp: 0,
            esic_emp: 0,
            pt: 0,
            tds: 0,
            loan: 0,
            advance: 0,
            other: 0,
            lop: 0,
            total_ded: 0,
            net: 0,
            pf_er: 0,
            esic_er: 0,
            bonus: 0
          };
        }
        const ut = unitTotals[unit];
        ut.count++;
        const basic = s.basic_salary || 0;
        const hra = s.hra || 0;
        const da = s.da || 0;
        const special = s.special_allowance || 0;
        const conveyance = s.conveyance_allowance || 0;
        const edu = s.edu_allowance || 0;
        const medical = s.medical_allowance || 0;
        const gross = s.gross_salary || 0;
        const pf_emp = s.pf_deduction || 0;
        const esic_emp = s.esic_deduction || 0;
        const pt = s.professional_tax || 0;
        const tds = s.tds || 0;
        const loan = s.loan_deduction || 0;
        const advance = s.salary_advance || 0;
        const other = s.other_deduction || 0;
        const lop = s.lop_deduction || 0;
        const total_ded = s.total_deductions || 0;
        const net = s.net_salary || 0;
        const pf_er = s.employer_pf || 0;
        const esic_er = s.employer_esic || 0;
        const bonus = s.bonus_payable || 0;
        ut.basic += basic;
        ut.hra += hra;
        ut.da += da;
        ut.special += special;
        ut.conveyance += conveyance;
        ut.edu += edu;
        ut.medical += medical;
        ut.gross += gross;
        ut.pf_emp += pf_emp;
        ut.esic_emp += esic_emp;
        ut.pt += pt;
        ut.tds += tds;
        ut.loan += loan;
        ut.advance += advance;
        ut.other += other;
        ut.lop += lop;
        ut.total_ded += total_ded;
        ut.net += net;
        ut.pf_er += pf_er;
        ut.esic_er += esic_er;
        ut.bonus += bonus;
        const row = [
          i + 1,
          s.employee_id,
          `"${s.employee_name}"`,
          `"${unit}"`,
          basic,
          hra,
          da,
          special,
          conveyance,
          edu,
          medical,
          gross,
          pf_emp,
          esic_emp,
          pt,
          tds,
          loan,
          advance,
          other,
          lop,
          total_ded,
          net,
          pf_er,
          esic_er,
          bonus
        ];
        lines.push(row.join(","));
      });
      lines.push("");
      lines.push('"UNIT-WISE SUMMARY"');
      lines.push('"Unit","Employees","Basic","HRA","Gross","PF(EE)","ESIC(EE)","Total Ded","Net Salary","PF(ER)","ESIC(ER)","Bonus"');
      for (const [unit, ut] of Object.entries(unitTotals)) {
        lines.push(`"${unit}",${ut.count},${ut.basic},${ut.hra},${ut.gross},${ut.pf_emp},${ut.esic_emp},${ut.total_ded},${ut.net},${ut.pf_er},${ut.esic_er},${ut.bonus}`);
      }
      const csvContent = lines.join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="Head_Wise_Accounting_${month}_${company || "ALL"}.csv"`);
      res.send(csvContent);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/accounting/unit-summary/:month", (req, res) => {
    try {
      const { month } = req.params;
      const companies = ["SVN-1", "SVN-II", "Sakar-I", "Sakar-III"];
      const summary = [];
      for (const company of companies) {
        const slips = db.getPayslipsByMonth(month, company);
        if (slips.length === 0) continue;
        let totalGross = 0, totalDeductions = 0, totalNet = 0;
        let totalPF = 0, totalESIC = 0, totalLoan = 0, totalBonus = 0;
        for (const s of slips) {
          totalGross += s.gross_salary || 0;
          totalDeductions += s.total_deductions || 0;
          totalNet += s.net_salary || 0;
          totalPF += (s.pf_deduction || 0) + (s.employer_pf || 0);
          totalESIC += (s.esic_deduction || 0) + (s.employer_esic || 0);
          totalLoan += s.loan_deduction || 0;
          totalBonus += s.bonus_payable || 0;
        }
        summary.push({
          company,
          employees: slips.length,
          totalGross,
          totalDeductions,
          totalNet,
          totalPF,
          totalESIC,
          totalLoan,
          totalBonus
        });
      }
      res.json({ month, summary });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/__debug/loans-state", (req, res) => {
    const loans = db.data?.loans || [];
    const employees = db.data?.employees || [];
    const statusMap = {};
    loans.forEach((l) => {
      const s = l.status || "NONE";
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const sample = loans.slice(0, 3).map((l) => ({
      id: l.id,
      employee_id: l.employee_id,
      amount: l.amount,
      opening_balance: l.opening_balance,
      monthly_deduction: l.monthly_deduction,
      status: l.status,
      emi_start_month: l.emi_start_month,
      keys: Object.keys(l).join(",")
    }));
    res.json({
      loansCount: loans.length,
      activeLoansCount: loans.filter((l) => l.status === "ACTIVE").length,
      employeesCount: employees.length,
      statusMap,
      inMemoryOnly: db.inMemoryOnly,
      loadedFromSeed: db.loadedFromSeed,
      sampleLoans: sample
    });
  });
  app.get("/api/reconciliation/:month", (req, res) => {
    try {
      const { month } = req.params;
      const { company } = req.query;
      const allowed = getAllowedCompanies(req);
      let employees = db.getEmployees(company && company !== "ALL" ? company : void 0);
      if (allowed) employees = employees.filter((e) => allowed.includes(e.company));
      const activeEmps = employees.filter((e) => e.status === "ACTIVE");
      const attendance = db.data.attendance.filter((a) => a.month === month);
      const payslips = db.getPayslipsByMonth(month, company && company !== "ALL" ? company : void 0);
      const leaves = (db.data.leave_applications || []).filter((l) => l.month === month);
      const loans = (db.data.loans || []).filter((l) => l.status === "ACTIVE");
      const empWithAttendance = new Set(attendance.map((a) => a.employee_id));
      const empWithPayslip = new Set(payslips.map((p) => p.employee_id));
      const empWithLeave = new Set(leaves.map((l) => l.employee_id));
      const missingAttendance = activeEmps.filter((e) => !empWithAttendance.has(e.id));
      const salaryWithoutAttendance = activeEmps.filter((e) => empWithPayslip.has(e.id) && !empWithAttendance.has(e.id));
      const totalGross = payslips.reduce((sum, p) => sum + (p.gross_salary || 0), 0);
      const totalDeductions = payslips.reduce((sum, p) => sum + (p.total_deductions || 0), 0);
      const totalNet = payslips.reduce((sum, p) => sum + (p.net_salary || 0), 0);
      const totalPF = payslips.reduce((sum, p) => sum + (p.pf_deduction || 0), 0);
      const totalESIC = payslips.reduce((sum, p) => sum + (p.esic_deduction || 0), 0);
      const totalPT = payslips.reduce((sum, p) => sum + (p.professional_tax || 0), 0);
      const totalTDS = payslips.reduce((sum, p) => sum + (p.tds || 0), 0);
      const totalLoan = payslips.reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
      const totalAdvance = payslips.reduce((sum, p) => sum + (p.salary_advance || 0), 0);
      const unitBreakdown = {};
      for (const slip of payslips) {
        const emp = db.getEmployeeById(slip.employee_id);
        const unit = emp?.company || "Unknown";
        if (!unitBreakdown[unit]) unitBreakdown[unit] = { count: 0, gross: 0, net: 0, deductions: 0 };
        unitBreakdown[unit].count++;
        unitBreakdown[unit].gross += slip.gross_salary || 0;
        unitBreakdown[unit].net += slip.net_salary || 0;
        unitBreakdown[unit].deductions += slip.total_deductions || 0;
      }
      const locked = db.isPayrollLocked(month, company);
      res.json({
        month,
        company: company || "ALL",
        is_locked: locked,
        total_active_employees: activeEmps.length,
        employees_with_attendance: empWithAttendance.size,
        employees_with_payslip: empWithPayslip.size,
        employees_with_leave: empWithLeave.size,
        active_loans: loans.length,
        missing_attendance_count: missingAttendance.length,
        missing_attendance_employees: missingAttendance.map((e) => ({ id: e.id, name: e.name, unit: e.company })),
        salary_without_attendance: salaryWithoutAttendance.length,
        total_gross: totalGross,
        total_deductions: totalDeductions,
        total_net: totalNet,
        total_pf: totalPF,
        total_esic: totalESIC,
        total_pt: totalPT,
        total_tds: totalTDS,
        total_loan: totalLoan,
        total_advance: totalAdvance,
        unit_breakdown: unitBreakdown
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  function parseCsvText(text) {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];
    const header = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim().toLowerCase());
    const out = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      if (cells.length === 1 && cells[0] === "") continue;
      const row = {};
      header.forEach((h, idx) => {
        if (h) row[h] = cells[idx] ?? "";
      });
      out.push(row);
    }
    return out;
  }
  app.post("/api/workforce/attendance/upload", async (req, res) => {
    try {
      const { company, month, source = "CSV", fileName = "upload.csv", text, rows, uploadedBy } = req.body || {};
      if (!company || !month) return res.status(400).json({ error: "company and month (YYYY-MM) are required" });
      if (source === "BIOMETRIC_DIRECT" && (await db.getWorkforceSettings())["direct_biometric_enabled"] !== "1") {
        return res.status(403).json({ error: "Direct biometric integration is disabled. Use CSV source (configured from next month)." });
      }
      const parsed = Array.isArray(rows) ? rows : typeof text === "string" ? parseCsvText(text) : [];
      if (parsed.length === 0) return res.status(400).json({ error: "No attendance rows received. Provide rows[] or CSV text." });
      const result = db.reconcileAttendanceUpload({ company, month, source, fileName, uploadedBy, rows: parsed, writeThrough: true });
      res.json({
        success: true,
        matched: result.matched,
        staffSkipped: result.staffSkipped.length,
        missingWorkers: result.missingWorkers,
        duplicates: result.duplicateIds,
        exceptions: result.exceptions.filter((e) => e.reason !== "Present in worker roster but NOT in uploaded CSV"),
        batch: result.batch
      });
    } catch (e) {
      res.status(500).json({ error: e.message || String(e) });
    }
  });
  app.get("/api/workforce/reconciliation/:month", (req, res) => {
    try {
      const { month } = req.params;
      const { company } = req.query;
      if (!company) return res.status(400).json({ error: "company query param is required" });
      res.json(db.getWorkerReconciliation(company, month));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/workforce/reconciliation/:month/finalize", async (req, res) => {
    try {
      const { month } = req.params;
      const { company, actor } = req.body || {};
      if (!company) return res.status(400).json({ error: "company is required" });
      const result = db.finalizeWorkerAttendance(company, month, actor || getOperator(req));
      await db.flushPendingWrites?.();
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/workforce/:month/payroll", async (req, res) => {
    try {
      const { month } = req.params;
      const { company, actor } = req.body || {};
      if (!company) return res.status(400).json({ error: "company is required" });
      const result = await db.generateWorkerPayroll(company, month, actor || getOperator(req));
      await db.flushPendingWrites?.();
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/workforce/settings", async (_req, res) => {
    try {
      res.json(await db.getWorkforceSettings());
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/workforce/settings", async (req, res) => {
    try {
      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: "key is required" });
      await db.setWorkforceSetting(key, String(value));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.get("/api/workforce/batches", (req, res) => {
    try {
      const { company, month } = req.query;
      if (!company) return res.status(400).json({ error: "company query param is required" });
      res.json(db.getWorkerBatches(company, month));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.post("/api/admin/standardize-names", async (req, res) => {
    try {
      const standardizeName = (name) => {
        if (!name) return name;
        return name.trim().replace(/\s+/g, " ").split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      };
      const employees = db.getEmployees();
      let fixed = 0;
      for (const emp of employees) {
        const standardizedName = standardizeName(emp.name);
        if (standardizedName !== emp.name) {
          db.updateEmployee(emp.id, { name: standardizedName });
          fixed++;
        }
      }
      await db.persistDataSync();
      res.json({ success: true, fixed, total: employees.length });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  app.locals = app.locals || {};
  app.locals.db = db;
  return app;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createApp,
  getAppDb
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Express application factory — shared by local dev (server.ts) and
 * Vercel Serverless Functions (api/[[...]].ts).
 */
