import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, ScrollView, View, StyleProp, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Item = { id: string };

/**
 * Drag-to-reorder list on RN core (PanResponder + Animated) — no
 * reanimated/gesture-handler needed. A grip handle starts the drag; tapping or
 * long-pressing the card is unaffected. The list scrolls normally when not
 * dragging (scrolling is paused during a drag). Rows may vary in height
 * (measured via onLayout). `onReorder` fires on drop with the new id order.
 */
export function DraggableList<T extends Item>({
  data,
  renderItem,
  onReorder,
  contentStyle,
  gap = 12,
}: {
  data: T[];
  renderItem: (item: T) => ReactNode;
  onReorder: (orderedIds: string[]) => void;
  contentStyle?: StyleProp<ViewStyle>;
  gap?: number;
}) {
  const [order, setOrder] = useState<T[]>(data);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const orderRef = useRef(order);
  orderRef.current = order;
  const draggingRef = useRef<string | null>(null);
  const heights = useRef<Record<string, number>>({});
  const curIndex = useRef(0);
  const offsetY = useRef(0);
  const pan = useRef(new Animated.Value(0)).current;
  const responders = useRef<Record<string, ReturnType<typeof PanResponder.create>>>({});

  useEffect(() => {
    if (!draggingRef.current) setOrder(data);
  }, [data]);

  const rowExtent = (id: string) => (heights.current[id] ?? 64) + gap;

  function startDrag(id: string) {
    curIndex.current = orderRef.current.findIndex((x) => x.id === id);
    offsetY.current = 0;
    draggingRef.current = id;
    setDraggingId(id);
    pan.setValue(0);
  }

  function moveDrag(dy: number) {
    let translate = dy - offsetY.current;
    while (curIndex.current < orderRef.current.length - 1) {
      const next = orderRef.current[curIndex.current + 1];
      const h = rowExtent(next.id);
      if (translate > h / 2) {
        const na = orderRef.current.slice();
        [na[curIndex.current], na[curIndex.current + 1]] = [na[curIndex.current + 1], na[curIndex.current]];
        orderRef.current = na;
        setOrder(na);
        offsetY.current += h;
        curIndex.current += 1;
        translate = dy - offsetY.current;
      } else break;
    }
    while (curIndex.current > 0) {
      const prev = orderRef.current[curIndex.current - 1];
      const h = rowExtent(prev.id);
      if (translate < -h / 2) {
        const na = orderRef.current.slice();
        [na[curIndex.current], na[curIndex.current - 1]] = [na[curIndex.current - 1], na[curIndex.current]];
        orderRef.current = na;
        setOrder(na);
        offsetY.current -= h;
        curIndex.current -= 1;
        translate = dy - offsetY.current;
      } else break;
    }
    pan.setValue(dy - offsetY.current);
  }

  function endDrag() {
    // Commit the new order now, but keep the card "dragging" (transform applied)
    // so the spring visibly snaps it into its slot; clear only when it settles.
    onReorder(orderRef.current.map((x) => x.id));
    Animated.spring(pan, {
      toValue: 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start(() => {
      draggingRef.current = null;
      setDraggingId(null);
    });
  }

  function responderFor(id: string) {
    if (!responders.current[id]) {
      responders.current[id] = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => startDrag(id),
        onPanResponderMove: (_e, g) => moveDrag(g.dy),
        onPanResponderRelease: endDrag,
        onPanResponderTerminate: endDrag,
      });
    }
    return responders.current[id];
  }

  return (
    <ScrollView scrollEnabled={draggingId == null} contentContainerStyle={contentStyle}>
      {order.map((item) => {
        const isDragging = item.id === draggingId;
        return (
          <Animated.View
            key={item.id}
            onLayout={(e) => { heights.current[item.id] = e.nativeEvent.layout.height; }}
            style={[
              { marginBottom: gap },
              isDragging && {
                transform: [{ translateY: pan }],
                zIndex: 20,
                shadowColor: '#000',
                shadowOpacity: 0.18,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 5 },
                elevation: 8,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>{renderItem(item)}</View>
              <View
                {...responderFor(item.id).panHandlers}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
                style={{ paddingHorizontal: 6, paddingVertical: 10, marginLeft: 2 }}
                accessible
                accessibilityLabel="Reorder location"
                accessibilityHint="Drag to change the order"
              >
                <MaterialCommunityIcons name="drag-horizontal-variant" size={22} color="#9aa0aa" />
              </View>
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}
