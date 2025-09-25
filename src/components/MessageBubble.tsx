import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  onImagePress?: (imageUri: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onImagePress }) => {
  const isUser = message.type === 'user';

  const renderSteps = () => {
    if (!message.steps || message.steps.length === 0) return null;

    return (
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>Steps to solve:</Text>
        {message.steps.map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      {isUser ? (
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userBubble}
        >
          {message.image && (
            <TouchableOpacity
              onPress={() => onImagePress && onImagePress(`data:image/jpeg;base64,${message.image}`)}
              style={styles.imageContainer}
            >
              <Image
                source={{ uri: `data:image/jpeg;base64,${message.image}` }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          <Text style={styles.userText}>{message.content}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.assistantBubble}>
          <Text style={styles.assistantText}>{message.content}</Text>
          {renderSteps()}
        </View>
      )}
      <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  userBubble: {
    maxWidth: '80%',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    padding: 16,
    elevation: 2,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  assistantBubble: {
    maxWidth: '80%',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  assistantText: {
    color: '#1E293B',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  imageContainer: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  stepsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  timestamp: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  userTimestamp: {
    textAlign: 'right',
  },
  assistantTimestamp: {
    textAlign: 'left',
  },
});