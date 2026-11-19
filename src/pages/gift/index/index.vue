<template>
  <view class="index-page">
    <!-- 轮播图 -->
    <swiper class="banner-swiper" indicator-dots autoplay circular v-if="banners.length > 0">
      <swiper-item v-for="(item, index) in banners" :key="index">
        <image :src="item.image" mode="aspectFill" class="banner-image" />
      </swiper-item>
    </swiper>
    <view class="banner-placeholder" v-else>
      <text>暂无轮播图</text>
    </view>
    
    <!-- 搜索区域 -->
    <view class="search-box">
      <view class="card-input">
        <view class="input-wrapper">
          <input type="text" v-model="cardNo" placeholder="请输入卡号" />
          <view class="input-clear" v-if="cardNo" @click="cardNo = ''">✕</view>
        </view>
        <view class="input-wrapper">
          <input type="text" v-model="cardPwd" placeholder="请输入密码" />
          <view class="input-clear" v-if="cardPwd" @click="cardPwd = ''">✕</view>
        </view>
        <button class="verify-btn" :class="{ disabled: !pickupEnabled }" :disabled="!pickupEnabled" @click="handleVerify">
          {{ pickupEnabled ? '立即预约' : '暂停兑换礼品' }}
        </button>
      </view>
    </view>
    
    <!-- 功能菜单 -->
    <view class="menu-grid">
      <view class="menu-item" @click="goVerify">
        <text class="menu-icon">🔍</text>
        <text class="menu-text">真伪验证</text>
      </view>
      <view class="menu-item" @click="goQuery">
        <text class="menu-icon">📦</text>
        <text class="menu-text">发货查询</text>
      </view>
    </view>
    
    <!-- 提货须知 -->
    <view class="section-title">提货须知</view>
    <view class="notice-box">
      <rich-text class="notice-text" :nodes="setting.notice || '暂无提货须知'"></rich-text>
      <view class="notice-contact" v-if="setting.contact || setting.service_mobile">
        <text class="notice-label">联系方式：</text>
        <text>{{ setting.contact }}{{ setting.contact && setting.service_mobile ? ' / ' : '' }}{{ setting.service_mobile }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getBanners, getSetting } from '@/api/gift'

const banners = ref([])
const cardNo = ref('')
const cardPwd = ref('')
const setting = ref({
  notice: '',
  contact: '',
  service_mobile: '',
  is_enable: 1
})

// 提货是否启用
const pickupEnabled = computed(() => setting.value.is_enable !== 0)

// 加载轮播图
const loadBanners = async () => {
  try {
    const res = await getBanners()
    if (res.code === 200) {
      banners.value = res.data || []
    }
  } catch (e) {
    console.error('加载轮播图失败', e)
  }
}

// 加载提货设置
const loadSetting = async () => {
  try {
    const res = await getSetting()
    if (res.code === 200 && res.data) {
      setting.value = {
        notice: res.data.notice || '',
        contact: res.data.contact || '',
        service_mobile: res.data.service_mobile || '',
        is_enable: res.data.is_enable
      }
    }
  } catch (e) {
    console.error('加载提货设置失败', e)
  }
}

// 立即预约/验证卡密
const handleVerify = () => {
  if (!pickupEnabled.value) {
    uni.showToast({ title: '提货功能已暂停', icon: 'none' })
    return
  }
  if (!cardNo.value || !cardPwd.value) {
    uni.showToast({ title: '请输入卡号和密码', icon: 'none' })
    return
  }
  // 参数约定：id=卡号, card_id=密码，后端 ApiController::activity() 通过卡号查卡密再获取 activity_id
  uni.navigateTo({ url: '/pages/gift/activity/index?id=' + cardNo.value + '&card_id=' + cardPwd.value })
}

// 真伪验证
const goVerify = () => {
  uni.switchTab({ url: '/pages/gift/verify/index' })
}

// 发货查询
const goQuery = () => {
  uni.switchTab({ url: '/pages/gift/query/index' })
}

onLoad(() => {
  loadBanners()
  loadSetting()
})
</script>

<style scoped>
.index-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.banner-swiper {
  height: 400rpx;
}

.banner-image {
  width: 100%;
  height: 100%;
}

.search-box {
  padding: 30rpx;
  background: #fff;
  margin-bottom: 20rpx;
}

.card-input {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.card-input .input-wrapper {
  position: relative;
  width: 100%;
}

.card-input .input-wrapper input {
  width: 100%;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 10rpx;
  padding: 0 60rpx 0 20rpx;
  box-sizing: border-box;
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

.verify-btn {
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 88rpx;
  padding: 0;
  border: none;
  margin: 0;
}
/* 覆盖 uniapp button 默认样式 */
.verify-btn::after {
  border: none;
}
/* 覆盖 H5 端 button 默认背景 */
.verify-btn[type] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.verify-btn.disabled,
.verify-btn[disabled] {
  background: #c0c0c0 !important;
  color: #fff;
}

.menu-grid {
  display: flex;
  background: #fff;
  padding: 30rpx 0;
  margin-bottom: 20rpx;
}

.menu-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-icon {
  font-size: 50rpx;
  margin-bottom: 10rpx;
}

.menu-text {
  font-size: 28rpx;
  color: #333;
}

.section-title {
  padding: 30rpx;
  font-size: 32rpx;
  font-weight: bold;
  background: #fff;
  margin-bottom: 10rpx;
}

.notice-box {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.notice-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
}

.notice-contact {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #eee;
  font-size: 26rpx;
  color: #666;
}

.notice-label {
  color: #999;
}

.banner-placeholder {
  height: 400rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: rgba(255,255,255,0.7);
}

.empty-tip {
  padding: 80rpx 0;
  text-align: center;
  font-size: 28rpx;
  color: #999;
}
</style>
