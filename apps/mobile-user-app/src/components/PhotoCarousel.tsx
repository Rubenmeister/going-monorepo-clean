import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
export interface CarouselItem {
  id: string;
  image: string | { uri: string };
  title?: string;
  subtitle?: string;
}

export interface PhotoCarouselProps {
  items: CarouselItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showOverlay?: boolean;
  containerStyle?: object;
  imageStyle?: object;
  indicatorActiveColor?: string;
  indicatorInactiveColor?: string;
  aspectRatio?: number;
  onSlideChange?: (index: number) => void;
  onItemPress?: (item: CarouselItem, index: number) => void;
  /** Render a custom slide instead of the default image */
  renderCustomSlide?: (item: CarouselItem, index: number) => React.ReactNode;
}

// Design tokens
const COLORS = {
  white: '#FFFFFF',
  black: '#1A1A1A',
  goingRed: '#FF4D4D',
  overlay: 'rgba(0,0,0,0.4)',
  indicatorInactive: '#D1D5DB',
};

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({
  items,
  autoPlay = true,
  autoPlayInterval = 4000,
  showIndicators = true,
  showOverlay = true,
  containerStyle,
  imageStyle,
  indicatorActiveColor = COLORS.black,
  indicatorInactiveColor = COLORS.indicatorInactive,
  aspectRatio = 16 / 9,
  onSlideChange,
  onItemPress,
  renderCustomSlide,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Calculate dimensions
  const itemWidth = SCREEN_WIDTH - 40; // Full width minus padding
  const itemHeight = itemWidth / aspectRatio;
  
  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isPaused || items.length <= 1) return;
    
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % items.length;
      scrollToIndex(nextIndex);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [autoPlay, isPaused, activeIndex, items.length, autoPlayInterval]);

  // Scroll to specific index
  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * (itemWidth + 16),
      animated: true,
    });
    setActiveIndex(index);
    onSlideChange?.(index);
  };

  // Handle scroll end
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / (itemWidth + 16));
    if (index >= 0 && index < items.length && index !== activeIndex) {
      setActiveIndex(index);
      onSlideChange?.(index);
    }
  };

  // Pause autoplay on touch
  const handleTouchStart = () => setIsPaused(true);
  const handleTouchEnd = () => setIsPaused(false);

  // Get image source
  const getImageSource = (image: string | { uri: string }) => {
    if (typeof image === 'string') {
      return { uri: image };
    }
    return image;
  };

  if (items.length === 0) return null;

  return (
    <View style={[styles.container, containerStyle]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={itemWidth + 16}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={onItemPress ? 0.9 : 1}
            onPress={() => onItemPress?.(item, index)}
            style={[
              styles.slide,
              { width: itemWidth, height: itemHeight },
            ]}
          >
            {renderCustomSlide ? (
              renderCustomSlide(item, index)
            ) : (
              <>
                <Image
                  source={getImageSource(item.image)}
                  style={[styles.image, imageStyle]}
                  resizeMode="cover"
                />
                {showOverlay && (item.title || item.subtitle) && (
                  <View style={styles.overlay}>
                    {item.title && (
                      <Text style={styles.title}>{item.title}</Text>
                    )}
                    {item.subtitle && (
                      <Text style={styles.subtitle}>{item.subtitle}</Text>
                    )}
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <View style={styles.indicatorsContainer}>
          {items.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => scrollToIndex(index)}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === activeIndex
                      ? indicatorActiveColor
                      : indicatorInactiveColor,
                  width: index === activeIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  slide: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.overlay,
  },
  title: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.9,
    marginTop: 4,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
  },
});

export default PhotoCarousel;
