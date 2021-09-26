import express from "express";
import fetch from 'node-fetch';
import vm from 'vm';
import Agenda from "dc-agenda";
import Agendash from "dc-agendash";
const app = express();
const agenda = new Agenda({ db: { address: "mongodb+srv://root:eWvshtdBr1515jPx@cluster0.yuhg0.mongodb.net/agenda?retryWrites=true&w=majority" } });
const { api } = require("dc-agendash/lib/controllers/agendash")(agenda, {});

async function initTask() {
  const res = await api(
    null,
    '',
    {
      limit: 1000,
      skip: "",
      q: "",
      property: ""
    }
  );
  for (const job_info of res.jobs) {
    const { job: j } = job_info;
    console.log(j)

    //
    agenda.define(j.name, async function (job, done) {
      try {
        global.fetch = fetch;
        console.log(job.attrs.data);
        const result = vm.runInThisContext(job.attrs.data);
        await result;
        done();
      } catch (err) {
        console.log(err)
        done(new Error(err))
      }
    })
  }
}

// 设置监听
agenda.on('start', (job) => {
  console.log('检测到job启动: ', job.attrs.name)
})

agenda.on('complete', (job) => {
  console.log('检测到job完成: ', job.attrs.name)
})

agenda.on('success', (job) => {
  console.log('检测到job成功: ', job.attrs.name)
})

// 直接指定
agenda.defaultLockLifetime(10000);

// agenda框架启动
agenda.on('ready', async function () {
  await initTask();
  await agenda.start();
  console.log("====>>>agenda启动成功<<<<===")
})

async function graceful() {
  await agenda.stop();
  console.log("====>>>agenda停止<<<<===")
  process.exit(0);
}

process.on("SIGTERM", graceful);
process.on("SIGINT", graceful);

app.use("/dash", Agendash(agenda));

app.listen(3000);