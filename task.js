'use strict';
const express = require('express');
const Web3 = require('web3');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const port = 9090;
const RESP_OK = "0";
const RESP_PARAMERR = "1";
const RESP_LOGINERR = "2";
const RESP_BLOCKERR = "3";
const RESP_UNKNOWNERR = "4";

class RespData {
  constructor(code, msg, data) {
    this.code = code;
    this.msg = msg;
    this.data = data;
  }
}

const respMap = {
  [RESP_OK]: "正常",
  [RESP_PARAMERR]: "参数异常",
  [RESP_LOGINERR]: "登陆失败",
  [RESP_BLOCKERR]: "区块链操作失败",
  [RESP_UNKNOWNERR]: "未知异常",
};

function getRespMsg(code) {
  return respMap[code];
}

class CustomError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.message = message || getRespMsg(code);
  }
}

app.use(bodyParser.json());
app.use(cookieParser());

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const TaskABI = JSON.parse(fs.readFileSync('./Task.abi').toString());
const TaskByteCode = '0x' + fs.readFileSync('./Task.bin').toString();

const ownerAddr = '0x497e0c5c7ec338902b8b7812fe176b075c5cc00c';

const Task = new web3.eth.Contract(TaskABI);

let contractAddr = '';
const taskRouter = express.Router();
app.use('/', taskRouter);

// 添加静态文件中间件
app.use(express.static(path.join(__dirname, 'dist')));

Task.deploy({
  data: TaskByteCode,
  arguments: [ownerAddr],
}).send({
  from: ownerAddr,
  gasPrice: '10000',
  gas: 5000000
}).on('error', function (error) {
  console.log(error);
}).on('transactionHash', function (transactionHash) {
  console.log("transactionHash:", transactionHash);
}).on('receipt', function (receipt) {
  console.log("receipt:", receipt);
  contractAddr = receipt.contractAddress;
}).then(function (newContractInstance) {
  console.log("newContractInstance:", newContractInstance);
  console.log("contractAddr:", contractAddr);
  Task.options.address = contractAddr; // 设置合约地址
  console.log("NewTask:", Task.options.address);

  // 如果其他路由不匹配任何请求，则返回index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  // 启动服务器
  app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
  });
});

// 注册接口 curl -X POST -H "Content-type:application/json" -d '{"username":"Anna","password":"123"}' http://localhost:9090/register
taskRouter.post('/register', async (req, res) => {
  try {
      console.log("Received data:", req.body); // Add this line to log received data

      const { username, password } = req.body;

      const result = await Task.methods.register(username, password).send({
          from: ownerAddr,
          gasPrice: '10000',
          gas: 5000000
      });

      console.log("register result:", result); // Add this line to log register result

      // Updated response format using RespData class
      const respData = new RespData("0", "正常", null);
      res.json(respData);
  } catch (error) {
      console.log(error);
      res.status(500).send(error);
  }
});


// 登录接口 curl -c anna.cookie -X POST -H "Content-type:application/json" -d '{"username":"Anna","password":"123"}' http://localhost:9090/login
taskRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("Received data:", req.body);

    const result = await Task.methods.login(username, password).call({
      from: ownerAddr,
    });

    console.log("login result:", result);

    if (result) {
      res.cookie('username', username, { maxAge: 30 * 60 * 1000 });
      res.cookie('password', password, { maxAge: 30 * 60 * 1000 });
      const respData = new RespData("0", "登录成功", { success: true });
      res.json(respData);
    } else {
      const respData = new RespData("1", "用户名或密码错误", { success: false });
      res.json(respData);
    }
    
  } catch (error) {
    console.log(error);
    const respData = new RespData("1", "错误", error);
    res.status(500).json(respData);
  }
});


// 任务发布接口 curl -b anna.cookie -X POST -H "Content-type:application/json" -d '{"task_name":"xiwan","bonus":200}' http://localhost:9090/issue
taskRouter.post('/issue', async (req, res) => {
  try {
    const { task_name, bonus } = req.body;
    const issuer = req.cookies.username;
    const passwd = req.cookies.password;

    if (!issuer || !passwd) {
      const respData = new RespData("1", "Issuer or password not found in cookie.", null);
      return res.status(400).json(respData);
    }

    const result = await Task.methods.issue(issuer, passwd, task_name, bonus).send({
      from: ownerAddr,
      gasPrice: '10000',
      gas: 5000000
    });

    const respData = new RespData("0", "正常", result);
    res.json(respData);
  } catch (error) {
    console.log(error);
    const respData = new RespData("1", "错误", error);
    res.status(500).json(respData);
  }
});


// 挖矿接口 curl -b anna.cookie -X POST -H "Content-type:application/json" -d '{"To":"Anna","Value":10000}' http://localhost:9090/mint
taskRouter.post('/mint', async (req, res) => {
  try {
      const { To, Value } = req.body;
      const result = await Task.methods.mint(To, Value).send({
          from: ownerAddr,
          gasPrice: '10000',
          gas: 5000000
      });

      const respData = new RespData("0", "正常", result);
      res.json(respData);
  } catch (error) {
      console.log(error);
      const respData = new RespData("1", "错误", error);
      res.status(500).json(respData);
  }
});

// 任务修改接口
// 以接受为例(status=1) curl -b grace.cookie -X POST -H "Content-type:application/json" -d '{"task_id":"0","task_status":1}' http://localhost:9090/update
// 提交任务 curl -b grace.cookie -X POST -H "Content-type:application/json" -d '{"task_id":"0","task_status":2}' http://localhost:9090/update
// 必须先创建另一个角色来调用 curl -X POST -H "Content-type:application/json" -d '{"username":"Grace","password":"456"}' http://localhost:9090/register
// 任务修改接口
// 以接受为例(status=1) curl -b grace.cookie -X POST -H "Content-type:application/json" -d '{"task_id":"0","task_status":1}' http://localhost:9090/update
// 提交任务 curl -b grace.cookie -X POST -H "Content-type:application/json" -d '{"task_id":"0","task_status":2}' http://localhost:9090/update
// 必须先创建另一个角色来调用 curl -X POST -H "Content-type:application/json" -d '{"username":"Grace","password":"456"}' http://localhost:9090/register
taskRouter.post('/update', async (req, res) => {
  try {
      const { task_id, task_status, comment } = req.body;
      const username = req.cookies.username;
      const passwd = req.cookies.password;
      console.log( "req.body",req.body);
      if (!username || !passwd) {
        const respData = new RespData("1", "Username or password not found in cookie.", null);
        return res.status(400).json(respData);
      }

      let result;
      if (task_status === 1) {
        result = await Task.methods.take(username, passwd, web3.utils.toBN(task_id).toString()).send({
            from: ownerAddr,
            gasPrice: '10000',
            gas: 5000000
        });
      } else if (task_status === 2) {
        result = await Task.methods.commit(username, passwd, web3.utils.toBN(task_id).toString()).send({
            from: ownerAddr,
            gasPrice: '10000',
            gas: 5000000
        });
      } else if (task_status === 3 || task_status === 4) {
        if (!comment) {
          const respData = new RespData("1", "Invalid comment value.", null);
          return res.status(400).json(respData);
        }
        let finalStatus = task_status === 4 ? 1 : task_status;
        result = await Task.methods.confirm(username, passwd, web3.utils.toBN(task_id).toString(), comment, finalStatus).send({
            from: ownerAddr,
            gasPrice: '10000',
            gas: 5000000
        });
      }

      const respData = new RespData("0", "正常", result);
      res.json(respData);
  } catch (error) {
      console.log(error);
      const respData = new RespData("1", "错误", error);
      res.status(500).json(respData);
  }
});


// 任务查询接口 curl http://localhost:9090/tasklist?page=1
taskRouter.get('/tasklist', async (req, res) => {
  try {
      const allTasks = await Task.methods.qryAllTasks().call();
      const taskCount = allTasks.length;
      const tasks = [];

      for (let k = 0; k < taskCount; k++) {
          const task = allTasks[k];

          const taskInfo = {
              task_id: k.toString(),
              issuer: task.issuer,
              task_user: task.worker,
              task_name: task.desc,
              bonus: parseInt(task.bonus, 10),
              comment: task.comment,
              task_status: parseInt(task.status, 10)
          };
          tasks.push(taskInfo);
      }

      // 分页
      const pageSize = 5;
      const page = parseInt(req.query.page) || 1;
      const totalPages = Math.ceil(taskCount / pageSize);
      const tasksToShow = tasks.slice((page - 1) * pageSize, page * pageSize);

      const respData = new RespData("0", "正常", {
          total: taskCount,
          data: tasksToShow
      });
      res.json(respData);
  } catch (error) {
      console.log(error);
      const respData = new RespData("1", "错误", error);
      res.status(500).json(respData);
  }
});