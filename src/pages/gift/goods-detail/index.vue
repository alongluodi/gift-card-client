<template>
  <view class="goods-detail">
    <!-- 轮播图 -->
    <swiper class="gallery" circular :indicator-dots="galleryImages.length > 1" indicator-color="rgba(0,0,0,0.3)"
      indicator-active-color="#ffffff" v-if="galleryImages.length > 0">
      <swiper-item v-for="(img, index) in galleryImages" :key="index">
        <image class="gallery-image" :src="img" mode="aspectFill" @click="previewImage(index)" />
      </swiper-item>
    </swiper>
    <view class="gallery gallery-empty" v-else>
      <text class="gallery-placeholder">📦</text>
    </view>

    <!-- 基础信息 -->
    <view class="info-card">
      <view class="goods-name">{{ goods.name }}</view>
      <view class="goods-meta">
        <!-- 活动勾选「不显示商品价格」时，跳转过来的详情页同样隐藏价格 -->
        <view class="goods-price" v-if="!hidePrice">
          <text class="price-symbol">¥</text>
          <text class="price-value">{{ goods.price }}</text>
        </view>
        <view class="goods-stock" :class="{ 'stock-low': goods.stock <= 10 }">
          库存 {{ goods.stock }} 件
        </view>
      </view>
    </view>

    <!-- 富文本详情 -->
    <view class="detail-card">
      <view class="detail-title">商品详情</view>
      <view class="detail-content" v-if="goods.detail">
        <rich-text :nodes="goods.detail"></rich-text>
      </view>
      <view class="detail-empty" v-else>
        <text>暂无更多详情</text>
      </view>
    </view>

    <!-- 加载失败 -->
    <view class="error-box" v-if="loadFailed">
      <text class="error-text">商品不存在或已下架</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getGoodsDetail } from '@/api/gift'

const goods = ref({})
const loadFailed = ref(false)
// 活动「不显示商品价格」：从活动页跳转时 URL 带 activity_id，后端在详情接口返回 hide_price
const hidePrice = ref(false)

const galleryImages = computed(() => {
  const images = Array.isArray(goods.value.images) ? goods.value.images : []
  if (images.length === 0 && goods.value.cover) {
    return [goods.value.cover]
  }
  return images
})

const loadDetail = async (id, activityId) => {
  try {
    const res = await getGoodsDetail(id, activityId)
    if (res.code === 200 && res.data) {
      goods.value = res.data
      hidePrice.value = Number(res.data.hide_price) === 1
    } else {
      loadFailed.value = true
    }
  } catch (e) {
    loadFailed.value = true
  }
}

const previewImage = (index) => {
  const urls = galleryImages.value
  if (!urls.length) return
  uni.previewImage({ urls, current: index })
}

onLoad((options) => {
  if (options && options.id) {
    // 非活动入口（直接分享链接等）没有 activity_id，按正常显示价格处理
    loadDetail(options.id, options.activity_id || '')
  } else {
    loadFailed.value = true
  }
})
</script>

<style lang="scss" scoped>
.goods-detail {
  min-height: 100vh;
  background: #f6f7f9;
  padding-bottom: 40rpx;
}

.gallery {
  width: 100%;
  height: 560rpx;
  background: #ffffff;

  &.gallery-empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .gallery-image {
    width: 100%;
    height: 100%;
  }

  .gallery-placeholder {
    font-size: 120rpx;
    opacity: 0.4;
  }
}

.info-card {
  margin: 20rpx 24rpx 0;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 32rpx;
}

.goods-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #1d2129;
  line-height: 1.5;
}

.goods-meta {
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.goods-price {
  color: #e53e30;

  .price-symbol {
    font-size: 26rpx;
  }

  .price-value {
    font-size: 44rpx;
    font-weight: 700;
  }
}

.goods-stock {
  font-size: 24rpx;
  color: #86909c;

  &.stock-low {
    color: #ff7d00;
  }
}

.detail-card {
  margin: 20rpx 24rpx 0;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 32rpx;
}

.detail-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f0f1f3;
}

.detail-content {
  font-size: 28rpx;
  color: #4e5969;
  line-height: 1.7;
  word-break: break-all;

  :deep(img),
  :deep(image) {
    max-width: 100% !important;
    height: auto !important;
  }
}

.detail-empty {
  padding: 40rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #c9cdd4;
}

.error-box {
  padding: 120rpx 0;
  text-align: center;

  .error-text {
    font-size: 28rpx;
    color: #86909c;
  }
}
</style>
