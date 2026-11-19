import { useUserStore, useSiteStore } from '@/stores'
import { mockRequest } from '@/mock'

const env = import.meta.env

// 默认登录页
const loginPage = env.VITE_LOGIN_PAGE

/**
 * 基本封装
 **/
const request = {
    // 接口地址
    interfaceUrl: function () {
        return env.VITE_APP_OPEN_PROXY === 'true' ? env.VITE_APP_PROXY_PREFIX : env.VITE_APP_BASE_URL
    },
    // 消息
    toast: function (text, duration, success) {
        uni.showToast({
            title: text || '出错啦~',
            icon: success ? 'success' : 'none',
            duration: duration || 2000
        })
    },
    // 对话框
    modal: function (title, content, showCancel, callback, confirmColor, confirmText) {
        uni.showModal({
            title: title || '提示',
            content: content,
            showCancel: showCancel,
            cancelColor: '#555',
            confirmColor: confirmColor || '#5677fc',
            confirmText: confirmText || '确定',
            success(res) {
                if (res.confirm) {
                    callback && callback(true)
                } else {
                    callback && callback(false)
                }
            }
        })
    },
    showLoading: function (title, mask = true) {
        uni.showLoading({
            mask: mask,
            title: title || '请稍候...'
        })
    },
    /**
     * 请求数据处理
     * @param string url 请求地址
     * @param string method 请求方式
     * @param {*} postData 请求数据
     * @param bool showLoading 是否显示loading
     * @param bool hideError 是否隐藏错误提示
     */
    request: async function (url, method, postData, showLoading, hideError) {
        let loadding = false
        if (showLoading) {
            loadding = true
            request.showLoading()
        }
        // 演示模式：VITE_USE_MOCK=true 时直接返回本地数据，不需要后端
        if (env.VITE_USE_MOCK === 'true') {
            return new Promise((resolve) => {
                setTimeout(() => {
                    if (loadding) uni.hideLoading()
                    resolve(mockRequest(url, method, postData))
                }, 160)
            })
        }
        const headers = {
            'content-type': 'application/json'
        }
        const { hasLogin, getToken } = useUserStore()
        if (hasLogin()) {
            headers['Authorization'] = `Bearer ${getToken().access_token}`
        }
        // 租户隔离：从 site store 读取 tenant_code 并设置 X-Tenant-Code header
        const siteStore = useSiteStore()
        if (siteStore.state.tenant_code) {
            headers['X-Tenant-Code'] = siteStore.state.tenant_code
        }
        return new Promise((resolve, reject) => {
            uni.request({
                url: request.interfaceUrl() + url,
                data: postData,
                header: headers,
                method: method,
                dataType: 'json',
                success: (res) => {
                    if (loadding && showLoading) {
                        uni.hideLoading()
                    }
                    if (res.statusCode == 500) {
                        request.toast('服务器内部错误，请检查服务器配置~')
                        reject(res)
                    }
                    if (!hideError && (res.data.code == 400 || res.data.code == 500)) {
                        request.toast(res.data.msg || res.data.message)
                    }
                    if (res.data.code == 401) {
                        uni.reLaunch({
                            url: loginPage
                        })
                    }
                    resolve(res.data)
                },
                fail: (res) => {
                    if (loadding && showLoading) {
                        uni.hideLoading()
                    }
                    request.toast('网络不给力，请稍后再试~')
                    reject(res)
                }
            })
        })
    },
    /**
     * 上传文件
     * @param string type 上传类型
     * @param string tempFilePaths 文件
     */
    uploadFile: async function (type, tempFilePaths) {
        if (!tempFilePaths) {
            return ''
        }
        if (!['image', 'file'].includes(type)) {
            request.toast('上传类型错误')
            return false
        }
        if (env.VITE_USE_MOCK === 'true') {
            request.toast('演示模式：上传已跳过')
            return '/static/logo.png'
        }
        request.showLoading()
        const headers = {}
        const { hasLogin, getToken } = useUserStore()
        if (hasLogin()) {
            headers['Authorization'] = `Bearer ${getToken().access_token}`
        }
        const siteStore = useSiteStore()
        if (siteStore.state.tenant_code) {
            headers['X-Tenant-Code'] = siteStore.state.tenant_code
        }
        return new Promise((resolve, reject) => {
            uni.uploadFile({
                url: request.interfaceUrl() + '/app/user/user/' + (type == 'image' ? 'uploadImage' : 'uploadFile'),
                filePath: tempFilePaths,
                name: type,
                header: headers,
                success: function (res) {
                    uni.hideLoading()
                    const data = JSON.parse(res.data)
                    if (data.code == 200) {
                        resolve(data.data.url)
                    } else {
                        request.toast(data.message)
                    }
                },
                fail: function (res) {
                    uni.hideLoading()
                    request.toast('出现错误，上传失败')
                    reject(res)
                }
            })
        })
    },
    dateFormat: function (date, fmt = 'yyyy-MM-dd hh:mm:ss', isDefault = '-') {
        if (!date) date = Number(new Date())
        if (date.toString().length == 10) {
            date = date * 1000
        }
        date = new Date(date)

        if (date.valueOf() < 1) {
            return isDefault
        }
        let o = {
            'M+': date.getMonth() + 1, //月份
            'd+': date.getDate(), //日
            'h+': date.getHours(), //小时
            'm+': date.getMinutes(), //分
            's+': date.getSeconds(), //秒
            'q+': Math.floor((date.getMonth() + 3) / 3), //季度
            S: date.getMilliseconds() //毫秒
        }
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
        }
        for (let k in o) {
            if (new RegExp('(' + k + ')').test(fmt)) {
                fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length))
            }
        }
        return fmt
    },
    dateStrFormat: function (date, fmt = 'day', isDefault = '-') {
        if (!date) {
            return isDefault
        }
        if (fmt === 'day') {
            return date.substr(0, 10)
        }
        if (fmt === 'time') {
            return date.substr(0, 16)
        }
        return isDefault
    },
    // 拨打电话
    makePhone: function (phoneNumber) {
        uni.makePhoneCall({
            phoneNumber: phoneNumber
        })
    },
    // 跳转链接
    href: function (url) {
        uni.navigateTo({
            url: url
        })
    },
    // 跳转链接
    switch: function (url) {
        uni.switchTab({
            url: url
        })
    },
    // 权限判断
    authHref: function (url) {
        const { hasLogin } = useUserStore()
        if (hasLogin()) {
            uni.navigateTo({
                url: url
            })
        } else {
            uni.navigateTo({
                url: loginPage
            })
        }
    },
    // 获取字典数据
    getDictData: async function (code) {
        const resp = await request('/app/user/index/dictData', 'get', { code: code })
        if (resp.code == 200) {
            return resp.data
        }
        return []
    },
    // 获取字典数据标签
    getLabel: function (dictData, value) {
        const item = dictData.find((item) => item.value == value)
        if (item) {
            return item.label
        }
        return ''
    }
}

// 对外暴露为函数：request(url, method, data)，同时保留 toast / modal 等工具方法
const api = (...args) => request.request(...args)
Object.assign(api, request)

export default api
