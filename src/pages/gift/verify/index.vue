<template>
  <view class="verify-page">
    <view class="header">
      <text class="title">真伪验证</text>
      <text class="subtitle">输入卡号验证提货卡是否有效</text>
    </view>
    
    <view class="form-box">
      <view class="input-group">
        <text class="label">卡号</text>
        <view class="input-wrapper">
          <input class="input" v-model="formData.card_no" placeholder="请输入卡号" />
          <view class="input-clear" v-if="formData.card_no" @click="formData.card_no = ''">✕</view>
        </view>
      </view>
      
      <view class="input-group">
        <text class="label">密码</text>
        <view class="input-wrapper">
          <input class="input" v-model="formData.card_pwd" placeholder="请输入密码" password />
          <view class="input-clear" v-if="formData.card_pwd" @click="formData.card_pwd = ''">✕</view>
        </view>
      </view>
      
      <button class="btn-primary" @click="handleVerify" :loading="loading">
        {{ loading ? '验证中...' : '立即验证' }}
      </button>
    </view>
    
    <!-- 验证结果 -->
    <view class="result-box" v-if="result">
      <view class="result-header">
        <text class="result-icon" :class="result.valid ? 'success' : 'error'">
          {{ result.valid ? '✓' : '✗' }}
        </text>
        <text class="result-title">{{ result.message }}</text>
      </view>
      
      <view class="result-content" v-if="result.valid && result.activity">
        <view class="info-item">
          <text class="info-label">活动名称：</text>
          <text class="info-value">{{ result.activity?.title || '-' }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">卡号状态：</text>
          <text class="info-value" :class="result.status === 0 ? 'green' : 'red'">
            {{ getStatusText(result.status) }}
          </text>
        </view>
        <view class="info-item">
          <text class="info-label">过期时间：</text>
          <text class="info-value">{{ result.expire_time || '永久有效' }}</text>
        </view>
        
        <!-- 操作按钮：根据卡密状态显示不同入口 -->
        <view class="result-actions">
          <button v-if="result.status === 0" class="btn-exchange" @click="goExchange">
            去兑换
          </button>
          <button v-if="result.status === 1" class="btn-query" @click="goQuery">
            查看订单
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { verifyCard } from '@/api/gift'

const loading = ref(false)
const result = ref(null)
const formData = reactive({
  card_no: '',
  card_pwd: ''
})

const getStatusText = (status) => {
  const texts = { 0: '未使用', 1: '已使用', 2: '已过期' }
  return texts[status] || '未知'
}

// 验证成功后跳转到兑换页面（复用 index 页参数约定：id=卡号，card_id=密码，后端 ApiController::activity() 已适配）
const goExchange = () => {
  uni.navigateTo({
    url: '/pages/gift/activity/index?id=' + formData.card_no + '&card_id=' + formData.card_pwd
  })
}

// 验证成功后跳转到订单查询页面
const goQuery = () => {
  uni.setStorageSync('query_card_no', formData.card_no)
  uni.setStorageSync('query_card_pwd', formData.card_pwd)
  uni.setStorageSync('auto_query', true)
  uni.switchTab({ url: '/pages/gift/query/index' })
}

const handleVerify = async () => {
  if (!formData.card_no || !formData.card_pwd) {
    uni.showToast({ title: '请输入卡号和密码', icon: 'none' })
    return
  }
  
  loading.value = true
  result.value = null
  
  try {
    const res = await verifyCard(formData)
    if (res.code === 200 && res.data) {
      result.value = {
        valid: true,
        message: '验证成功',
        card_id: res.data.card_id,
        card_no: res.data.card_no,
        status: res.data.status,
        activity: res.data.activity,
        expire_time: res.data.expire_time
      }
    } else {
      result.value = { valid: false, message: res.msg || '验证失败' }
    }
  } catch (error) {
    result.value = { valid: false, message: '网络错误，请稍后重试' }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 20rpx;
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255,255,255,0.8);
}

.form-box {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 40rpx rgba(0,0,0,0.1);
}

.input-group {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  font-weight: 500;
}

.input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 0 60rpx 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.input-clear {
  position: absolute;
  right: 0;
  top: 0;
  width: 60rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #999;
  z-index: 2;
}

.btn-primary {
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 44rpx;
  border: none;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 20rpx;
}

.result-box {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-top: 40rpx;
  box-shadow: 0 10rpx 40rpx rgba(0,0,0,0.1);
}

.result-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.result-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #fff;
  margin-right: 20rpx;
}

.result-icon.success {
  background: #07c160;
}

.result-icon.error {
  background: #f53f3f;
}

.result-title {
  font-size: 32rpx;
  font-weight: 500;
}

.result-content {
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
}

.info-item {
  display: flex;
  padding: 15rpx 0;
  font-size: 28rpx;
}

.info-label {
  color: #666;
  width: 160rpx;
}

.info-value {
  color: #333;
  flex: 1;
}

.info-value.green {
  color: #07c160;
}

.info-value.red {
  color: #f53f3f;
}

.result-actions {
  margin-top: 30rpx;
  display: flex;
  gap: 20rpx;
}

.btn-exchange, .btn-query {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  border: none;
  line-height: 80rpx;
  padding: 0;
  text-align: center;
}

.btn-exchange {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.btn-query {
  background: #f5f5f5;
  color: #333;
}
</style>
