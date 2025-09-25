import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onImagePicker: () => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onImagePicker,
  isLoading,
}) => {
  const [message, setMessage] = useState('');
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleImagePress = () => {
    if (!isLoading) {
      onImagePicker();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Button press animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Animated.View style={[styles.imageButton, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity
            onPress={handleImagePress}
            disabled={isLoading}
            style={styles.imageButtonTouchable}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.imageButtonGradient}
            >
              <Text style={styles.imageButtonText}>📷</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <TextInput
          style={styles.textInput}
          placeholder="Ask a homework question or take a photo..."
          placeholderTextColor="#94A3B8"
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          editable={!isLoading}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={!message.trim() || isLoading}
          style={[
            styles.sendButton,
            (!message.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
        >
          <LinearGradient
            colors={
              message.trim() && !isLoading
                ? ['#4F46E5', '#7C3AED']
                : ['#CBD5E1', '#94A3B8']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sendButtonGradient}
          >
            <Text style={styles.sendButtonText}>
              {isLoading ? '⏳' : '➤'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  imageButton: {
    marginBottom: 4,
  },
  imageButtonTouchable: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  imageButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    marginBottom: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});