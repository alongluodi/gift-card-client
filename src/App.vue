<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { siteInfoApi } from '@/api/common'
import { useSiteStore, useUserStore } from '@/stores'

onLaunch(async () => {
    const siteStore = useSiteStore()
    const userStore = useUserStore()

    // 租户编码优先级：URL/启动参数 > .env 兜底
    let urlTenantCode = ''
    // #ifdef H5
    try {
        const searchParams = new URLSearchParams(window.location.search)
        urlTenantCode = searchParams.get('tenant') || ''
    } catch (e) { /* 忽略 */ }
    // #endif
    // #ifdef MP-WEIXIN
    // 微信小程序：通过启动参数获取 tenant（小程序码路径如 pages/gift/index/index?tenant=DEMO001）
    try {
        const enterOptions = wx.getEnterOptionsSync ? wx.getEnterOptionsSync() : null
        if (enterOptions && enterOptions.query && enterOptions.query.tenant) {
            urlTenantCode = enterOptions.query.tenant
        }
    } catch (e) { /* 忽略 */ }
    // #endif
    // 兜底：.env 中的 VITE_TENANT_CODE（编译时注入，每个租户各自修改 .env 即可）
    const tenantCode = urlTenantCode || import.meta.env.VITE_TENANT_CODE || ''
    if (tenantCode) {
        siteStore.setSiteInfo({ tenant_code: tenantCode })
    }

    const resp = await siteInfoApi()
    if (resp.code === 200) {
        siteStore.setSiteInfo(resp.data)
        userStore.refreshUserInfo()
    }
    
    // 修复：siteInfoApi 可能覆盖 URL / .env 中的 tenant_code，需恢复
    if (tenantCode) {
        siteStore.setSiteInfo({ tenant_code: tenantCode })
    }
})
onShow(() => {
    console.log('App Show')
})
onHide(() => {
    console.log('App Hide')
})
</script>

<style>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@import './static/css/global.scss';

/* ===== 全局 button 基础重置 =====
   微信小程序原生 button 自带 ::after 伪元素（200% 尺寸 + 1px 边框 + transform: scale(.5) 缩放），
   叠在页面自定义的大圆角（44rpx / 40rpx 胶囊）上时，圆角边缘会出现双层轮廓和毛边（看起来"虚"）。
   这里统一清掉，圆角只由各页面 class 的 border-radius 控制，避免每个页面各自补 ::after。 */
button::after {
  border: none;
  border-radius: 0;
}

/* 部分机型/基础库下取消按钮点击时的默认高亮遮罩，避免圆角处出现灰边 */
button {
  -webkit-tap-highlight-color: transparent;
}
</style>
