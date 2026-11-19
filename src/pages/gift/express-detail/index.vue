<template>
  <view class="express-page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="nav-back" hover-class="opacity-75" @click="goBack">
          <uni-icons type="back" color="#ffffff" size="22" />
        </view>
        <text class="nav-title">物流详情</text>
        <view class="nav-placeholder"></view>
      </view>
    </view>

    <!-- 内容区（顶部让出固定导航栏高度） -->
    <view class="content" :style="{ paddingTop: (statusBarHeight + 56) + 'px' }">
      <!-- 快递信息卡片 -->
      <view class="express-card">
        <view class="express-icon">
          <uni-icons type="paperplane-filled" color="#667eea" size="26" />
        </view>
        <view class="express-main">
          <view class="express-top">
            <text class="express-name">{{ expressName || '快递查询' }}</text>
            <text class="express-state" :class="'state-' + state">
              {{ stateText || (loading ? '查询中' : '待查询') }}
            </text>
          </view>
          <view class="express-no-row" @click="copyExpressNo">
            <text class="express-no">{{ expressNo || '—' }}</text>
            <text class="copy-btn" v-if="expressNo">复制</text>
          </view>
        </view>
      </view>

      <!-- 手机尾号（2026-11-10：顺丰等快递需收件人手机后 4 位才能查询） -->
      <view class="mobile-card">
        <view class="mobile-row">
          <text class="mobile-label">手机4位尾号：</text>
          <input
            class="mobile-input"
            v-model="mobileTail"
            type="number"
            maxlength="4"
            placeholder="顺丰需填手机后4位"
            placeholder-class="mobile-placeholder"
            @confirm="loadTrack"
          />
          <button class="mobile-btn" :loading="loading" @click="loadTrack">查询</button>
        </view>
        <view class="mobile-tip" v-if="isSfExpress && !mobileTailValid">顺丰需要输入手机4位尾号</view>
      </view>

      <!-- 物流轨迹时间轴 -->
      <view class="track-box">
        <view class="track-title">物流轨迹</view>
      
        <!-- 加载中 -->
        <view class="track-loading" v-if="loading">
          <text class="loading-text">查询中...</text>
        </view>
      
        <!-- 无数据 -->
        <view class="track-empty" v-else-if="!traces.length">
          <text class="empty-text">{{ isSfExpress && !hasQueried ? '请输入手机4位尾号后点击查询' : '暂无物流信息' }}</text>
        </view>
      
        <!-- 轨迹列表 -->
        <view class="track-list" v-else>
          <view 
            class="track-item" 
            v-for="(item, index) in traces" 
            :key="index"
            :class="{ 'track-first': index === 0, 'track-last': index === traces.length - 1 }"
          >
            <view class="track-dot-wrapper">
              <view class="track-dot" :class="{ 'dot-active': index === 0 }"></view>
              <view class="track-line" v-if="index !== traces.length - 1"></view>
            </view>
            <view class="track-content">
              <text class="track-desc">{{ item.AcceptStation || item.desc || item.content || '' }}</text>
              <text class="track-time">{{ item.AcceptTime || item.time || '' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部返回按钮 -->
      <view class="footer">
        <button class="btn-back" @click="goBack">返回</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { queryExpressTrack } from '@/api/gift'

const statusBarHeight = ref(0)
const loading = ref(false)
const expressCode = ref('')
const expressNo = ref('')
const expressName = ref('')
const mobile = ref('')
const mobileTail = ref('') // 手机后 4 位（顺丰等快递必填，2026-11-10）
const cardNo = ref('')
const state = ref('')
const stateText = ref('')
const traces = ref([])
const hasQueried = ref(false) // 是否已发起过查询（用于区分「未查询」和「无轨迹」）

// 是否顺丰：编码 SF 或公司名含「顺丰」（历史数据可能只有名称）
const isSfExpress = computed(() => {
  const code = (expressCode.value || '').toUpperCase()
  const name = expressName.value || ''
  return code === 'SF' || name.includes('顺丰')
})

// 手机尾号是否有效（4 位纯数字）；v-model 在部分端会拿到 number，统一转字符串
const mobileTailValid = computed(() => /^\d{4}$/.test(String(mobileTail.value ?? '')))

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  statusBarHeight.value = systemInfo.statusBarHeight || 0
})

onLoad((options) => {
  expressCode.value = options.express_code || ''
  expressNo.value = options.express_no || ''
  expressName.value = options.express_name || ''
  mobile.value = options.mobile || ''
  cardNo.value = options.card_no || ''

  // 预填手机后 4 位（上游订单详情会把完整手机号带过来）
  const digits = String(mobile.value).replace(/\D/g, '')
  mobileTail.value = digits.length >= 4 ? digits.slice(-4) : ''

  if (expressCode.value && expressNo.value) {
    // 顺丰必须带尾号，没预填到就先等用户输入，避免必然失败还白扣一次配额
    if (isSfExpress.value && !mobileTailValid.value) {
      return
    }
    loadTrack()
  }
})

const loadTrack = async () => {
  if (!expressCode.value || !expressNo.value) return
  // 顺丰强制校验手机后 4 位
  if (isSfExpress.value && !mobileTailValid.value) {
    uni.showToast({ title: '顺丰需要输入手机4位尾号', icon: 'none' })
    return
  }
  loading.value = true
  hasQueried.value = true
  try {
    const res = await queryExpressTrack(expressCode.value, expressNo.value, mobileTail.value, cardNo.value)
    if (res.code === 200 && res.data) {
      const data = res.data
      state.value = data.state || ''
      stateText.value = data.state_text || ''
      expressName.value = data.express_name || expressName.value
      traces.value = data.traces || []
    } else {
      uni.showToast({ title: res.msg || '查询失败', icon: 'none' })
    }
  } catch (error) {
    uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const copyExpressNo = () => {
  if (!expressNo.value) return
  uni.setClipboardData({
    data: expressNo.value,
    success: () => {
      uni.showToast({ title: '单号已复制', icon: 'none' })
    }
  })
}

const goBack = () => {
  uni.navigateBack({ delta: 1 })
}
</script>

<style scoped>
.express-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding-bottom: 40rpx;
  box-sizing: border-box;
}

/* 内容区：顶部让出固定导航栏的高度，padding-top 由内联样式给出 */
.content {
  box-sizing: border-box;
}

/* 自定义导航栏 */
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2rpx 12rpx rgba(102, 126, 234, 0.18);
}

.nav-content {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8rpx 0 4rpx;
}

/* 返回按钮：44px 点击区 + 按压反馈 */
.nav-back {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.nav-title {
  color: #fff;
  font-size: 17px;
  font-weight: 500;
}

.nav-placeholder {
  width: 88rpx;
}

/* 手机尾号（2026-11-10） */
.mobile-card {
  background: #fff;
  margin: 0 30rpx 24rpx;
  border-radius: 20rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(29, 33, 41, 0.06);
}

.mobile-row {
  display: flex;
  align-items: center;
}

.mobile-label {
  width: 190rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  color: #666;
}

.mobile-input {
  flex: 1;
  height: 72rpx;
  line-height: 72rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  background: #f7f8fa;
  border: 1rpx solid #e5e6eb;
  border-radius: 8rpx;
  box-sizing: border-box;
}

.mobile-placeholder {
  color: #a8abb2;
  font-size: 26rpx;
}

.mobile-btn {
  width: 140rpx;
  height: 72rpx;
  line-height: 72rpx;
  margin-left: 16rpx;
  padding: 0;
  font-size: 28rpx;
  color: #fff;
  background: #4b7cf3;
  border: none;
  border-radius: 8rpx;
}

.mobile-btn::after {
  border: none;
}

.mobile-tip {
  margin-top: 16rpx;
  font-size: 24rpx;
  color: #f53f3f;
}

/* 快递信息卡片：白底浮卡，避免与顶部紫色导航连成一块色块 */
.express-card {
  display: flex;
  align-items: flex-start;
  margin: 0 30rpx 24rpx;
  padding: 32rpx;
  background: #fff;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(29, 33, 41, 0.06);
}

.express-icon {
  width: 88rpx;
  height: 88rpx;
  flex-shrink: 0;
  margin-right: 24rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #eef1ff 0%, #f5efff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.express-main {
  flex: 1;
  min-width: 0;
}

.express-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
}

.express-name {
  flex: 1;
  min-width: 0;
  font-size: 32rpx;
  font-weight: 600;
  color: #1d2129;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 状态胶囊：按物流状态着色 */
.express-state {
  flex-shrink: 0;
  margin-left: 16rpx;
  padding: 4rpx 18rpx;
  font-size: 22rpx;
  line-height: 1.6;
  border-radius: 999rpx;
  white-space: nowrap;
  background: #f2f3f5;
  color: #86909c;
}

.state-1,
.state-2 {
  background: rgba(22, 93, 255, 0.1);
  color: #165dff;
}

.state-3 {
  background: rgba(0, 180, 42, 0.1);
  color: #00b42a;
}

.state-4 {
  background: rgba(245, 63, 63, 0.1);
  color: #f53f3f;
}

.state-5,
.state-6 {
  background: rgba(255, 125, 0, 0.1);
  color: #ff7d00;
}

.express-no-row {
  display: flex;
  align-items: center;
}

.express-no {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: #4e5969;
  letter-spacing: 1rpx;
  word-break: break-all;
}

.copy-btn {
  flex-shrink: 0;
  margin-left: 16rpx;
  padding: 2rpx 18rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: #667eea;
  background: #eef1ff;
  border-radius: 999rpx;
}

/* 物流轨迹 */
.track-box {
  background: #fff;
  margin: 0 30rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  min-height: 400rpx;
}

.track-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.track-loading,
.track-empty {
  text-align: center;
  padding: 80rpx 0;
}

.loading-text,
.empty-text {
  font-size: 28rpx;
  color: #999;
}

.track-list {
  padding-left: 10rpx;
}

.track-item {
  display: flex;
  position: relative;
}

.track-dot-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.track-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #d9d9d9;
  margin-top: 8rpx;
  flex-shrink: 0;
}

.dot-active {
  width: 24rpx;
  height: 24rpx;
  background: #667eea;
  box-shadow: 0 0 0 6rpx rgba(102, 126, 234, 0.2);
  margin-top: 6rpx;
}

.track-line {
  width: 2rpx;
  flex: 1;
  background: #e8e8e8;
  margin: 8rpx 0;
}

.track-content {
  flex: 1;
  padding-bottom: 40rpx;
}

.track-first .track-content {
  padding-bottom: 50rpx;
}

.track-last .track-content {
  padding-bottom: 0;
}

.track-desc {
  display: block;
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 10rpx;
}

.track-first .track-desc {
  color: #667eea;
  font-weight: 500;
}

.track-time {
  display: block;
  font-size: 24rpx;
  color: #999;
}

/* 底部返回按钮：顶部已有返回箭头，这里做次要样式，避免两个主色大按钮抢视觉 */
.footer {
  padding: 24rpx 30rpx 40rpx;
}

.btn-back {
  height: 84rpx;
  background: #fff;
  color: #4e5969;
  border-radius: 42rpx;
  border: 1rpx solid #e5e6eb;
  font-size: 30rpx;
  font-weight: 400;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-back::after {
  border: none;
}
</style>
