import axios from "axios";

// 创建axios实例
const instance = axios.create({
    timeout: 10000, // 请求超时时间
});

// 请求拦截器
instance.interceptors.request.use(
    (config) => {
        if (!config.noAuth) {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
instance.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        if (error.response) {
            console.error("Response error:", error.response);
        } else {
            console.error("Request error:", error.message);
        }
        return Promise.reject(error);
    }
);

const get = (url, params = {}, config = {}) => {
    return instance.get(url, {params, ...config});
};

const post = (url, data = {}, config = {}) => {
    return instance.post(url, data, {...config});
};

const put = (url, data = {}, config = {}) => {
    return instance.put(url, data, {...config});
};

const del = (url, data = {}, config = {}) => {
    return instance.delete(url, {data, ...config});
};

const patch = (url, data = {}, config = {}) => {
    return instance.patch(url, data, {...config});
};

const request = (url, data, config = {}) => {
    console.log(data);
    return instance.request({
        method: config.method,
        url: url,
        headers: {
            'Content-Type': config.contentType,
        },
        data: data,
    });
}

const api = {
    get,
    post,
    put,
    del,
    patch,
    request
};

export default api;
