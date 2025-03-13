<template>
  <div class="login-container">
    <h2>登录</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">用户名:</label>
        <input
            type="text"
            id="username"
            v-model="username"
            required
            placeholder="请输入用户名"
        />
      </div>
      <div class="form-group">
        <label for="password">密码:</label>
        <input
            type="password"
            id="password"
            v-model="password"
            required
            placeholder="请输入密码"
        />
      </div>
      <button type="submit">登录</button>
    </form>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
  <div class="chat-container">
    <div class="msg-area"></div>
    <div class="send-area">写一个cpp的hello world程序  贝叶斯概率公式是什么</div>
  </div>
  <input type="text" v-model="prompt"/>
  <button @click="sendMessage" style="margin-top: 5px;margin-bottom: 5px;">发送</button>
  <div v-html="md.render(ans)" class="markdown-body"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import api from "./js/request.js";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import MarkdownIt from "markdown-it";
import "github-markdown-css";
import hljs from "highlight.js/lib/core";
import "highlight.js/styles/github.css"
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import javascript from 'highlight.js/lib/languages/javascript';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import cmake from 'highlight.js/lib/languages/cmake';
import yaml from 'highlight.js/lib/languages/yaml';
import typescript from 'highlight.js/lib/languages/typescript';
import json from 'highlight.js/lib/languages/json';
import csharp from 'highlight.js/lib/languages/csharp';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import markdown from 'highlight.js/lib/languages/markdown';

hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('java', java);
hljs.registerLanguage('python', python);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('cmake', cmake);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('markdown', markdown);


const username = ref('');
const password = ref('');
const errorMessage = ref('');
const serverAddress = "http://localhost:8088/api";
const prompt = ref('');
//let ans = '\`\`\`cpp \n #include <iostream>\n using namespace std;\n int main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n\`\`\`';
const ans = ref('$\\Sigma_{i=1}^{n}x^2$');
let md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true,
  xhtmlOut: true,
  typographer: true,
  highlight: function (str, lang) {
    let codeContent = '';
    if (lang && hljs.getLanguage(lang)) {
      try {
        codeContent = hljs.highlight(lang, str).value;
      } catch (__) { }
    } else {
      codeContent = md.utils.escapeHtml(str);
    }
    return (
        '<pre class="hljs"><code>' +
        codeContent +
        '<b>' + lang + '</b>' +
        '</code></pre>'
    );
  },
});
const handleLogin = async () => {
  try {
    const response = await api.post(serverAddress + "/user/login", {
      username: username.value,
      password: password.value
    }, {noAuth: true});
    if (response.code === 0) {
      localStorage.setItem("token", response.data.token);
      alert("success");
    }
    else
      errorMessage.value = response.message;
  } catch (e) {
    console.log(e);
  }
}

const sendMessage = async () => {
  ans.value = '**正在思考...**';
  let think = false;
  if (prompt.value) {
    const ctrl = new AbortController();
    const eventSource = fetchEventSource(serverAddress + "/chat/stream", {
      method: 'POST',
      headers: {
        "Accept": 'text/event-stream',
        "content-type": 'application/json',
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        model: "deepseek-r1:8b",
        prompt: prompt.value
      }),
      signal: ctrl.signal,
      onopen(response) {
        if (response.status !== 200) {
          ctrl.abort();
          console.log("failed to connect");
          ans.value = ' **服务器繁忙，请稍候再试。** ';
          return false;
        }
        console.log("connected");
      },
      onmessage(event) {
        const data = JSON.parse(event.data);
        console.log(data);
        //console.log(data.message);
        let content = String(data.message.content);
        if (think) {
          content = content.replace(/\n/g, "\n>");
          if (content.includes("</think>")) {
            content = content.replace("</think>", "");
            think = false;
          }
          ans.value += content;
        } else {
          if (content.includes("<think>")) {
            ans.value = '';
            content = content.replace("<think>", "> 深度思考：\n > ");
            think = true;
          }
          ans.value += content;
        }
        if (isAtBottom()) {
          window.scrollBy({
            top: 100,
            behavior: "smooth",
          });
        }
      },
      onclose() {
        console.log("close");
      },
      onerror(e) {
        console.log(e);
        ans.value += ' **服务器繁忙，请稍候再试。** ';
        throw e;
      }
    });
  } else {
    ans.value = ' **请输入问题** ';
  }
}
const isAtBottom = () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const clientHeight = document.documentElement.clientHeight;
  const scrollHeight = document.documentElement.scrollHeight;
  return scrollTop + clientHeight >= scrollHeight - 50;
}


onMounted(() => {

});
onUnmounted(() => {

})
</script>

<style scoped>
.login-container {
  width: 500px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
}

input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
}

button {
  width: 100%;
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #218838;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.chat-container {
  width: 97%;
  margin-top: 10px;
  background-color: #f9f9f9;
  padding: 20px;
  height: 500px;
  border-radius: 20px;
}

.msg-area {
  height: 400px;
  background-color: #28a745;
}

.send-area {
  margin-top: 10px;
  height: 90px;
  background-color: #218838;
}

.markdown-container {
  width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
  padding: 45px;
}

@media (max-width: 767px) {
  .markdown-body {
    padding: 15px;
  }
}
</style>
