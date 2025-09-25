import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import type { Message, ChatSession } from '../types';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { AIService } from '../services/aiService';
import { StorageService } from '../services/storageService';
import { ImageUtils } from '../utils/imageUtils';

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      const currentSessionId = await StorageService.getCurrentSession();
      const sessions = await StorageService.getChatSessions();
      
      let session: ChatSession;
      
      if (currentSessionId) {
        const existingSession = sessions.find(s => s.id === currentSessionId);
        if (existingSession) {
          session = existingSession;
        } else {
          session = await StorageService.createNewSession();
        }
      } else {
        session = await StorageService.createNewSession();
      }
      
      setCurrentSession(session);
      setMessages(session.messages);
    } catch (error) {
      console.error('Error initializing chat:', error);
      Alert.alert('Error', 'Failed to initialize chat. Please restart the app.');
    }
  };

  const addMessage = async (message: Message) => {
    const newMessages = [...messages, message];
    setMessages(newMessages);
    
    if (currentSession) {
      await StorageService.updateSession(currentSession.id, newMessages);
    }
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: Date.now(),
    };

    await addMessage(userMessage);
    setIsLoading(true);

    try {
      const response = await AIService.askQuestion(text);
      const steps = AIService.parseSteps(response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: Date.now(),
        ...(steps.length > 1 && { steps }),
      };

      await addMessage(assistantMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        timestamp: Date.now(),
      };
      await addMessage(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePicker = () => {
    ImageUtils.showImagePickerOptions(
      () => handleImageSelection('camera'),
      () => handleImageSelection('library')
    );
  };

  const handleImageSelection = async (source: 'camera' | 'library') => {
    setIsLoading(true);
    
    try {
      const imageBase64 = source === 'camera' 
        ? await ImageUtils.pickImageFromCamera()
        : await ImageUtils.pickImageFromLibrary();

      if (imageBase64) {
        const userMessage: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: 'Please help me solve this homework problem.',
          image: imageBase64,
          timestamp: Date.now(),
        };

        await addMessage(userMessage);

        try {
          const response = await AIService.analyzeImage(imageBase64);
          const steps = AIService.parseSteps(response);

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: response,
            timestamp: Date.now(),
            ...(steps.length > 1 && { steps }),
          };

          await addMessage(assistantMessage);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.error('Error analyzing image:', error);
          const errorMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: 'Sorry, I encountered an error while analyzing your image. Please try again.',
            timestamp: Date.now(),
          };
          await addMessage(errorMessage);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
    } catch (error) {
      console.error('Error handling image:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImagePress = (imageUri: string) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };

  const handleNewChat = async () => {
    try {
      const newSession = await StorageService.createNewSession();
      setCurrentSession(newSession);
      setMessages([]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error creating new chat:', error);
      Alert.alert('Error', 'Failed to create new chat.');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <MessageBubble message={item} onImagePress={handleImagePress} />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyStateIcon}
      >
        <Text style={styles.emptyStateIconText}>🎓</Text>
      </LinearGradient>
      <Text style={styles.emptyStateTitle}>Welcome to ChatHub!</Text>
      <Text style={styles.emptyStateSubtitle}>
        Your AI homework helper is ready to assist you.
      </Text>
      <View style={styles.emptyStateFeatures}>
        <Text style={styles.emptyStateFeature}>📷 Take a photo of your homework</Text>
        <Text style={styles.emptyStateFeature}>💬 Ask questions directly</Text>
        <Text style={styles.emptyStateFeature}>📝 Get step-by-step solutions</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>ChatHub</Text>
        <TouchableOpacity onPress={handleNewChat} style={styles.newChatButton}>
          <Text style={styles.newChatButtonText}>New Chat</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={messages.length === 0 ? styles.emptyContainer : styles.messagesContainer}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4F46E5" />
          <Text style={styles.loadingText}>Thinking...</Text>
        </View>
      )}

      {/* Chat Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onImagePicker={handleImagePicker}
        isLoading={isLoading}
      />

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalOverlay}
            onPress={() => setImageModalVisible(false)}
          >
            <View style={styles.imageModalContent}>
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  newChatButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateIconText: {
    fontSize: 36,
  },
  emptyStateTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyStateFeatures: {
    alignItems: 'flex-start',
  },
  emptyStateFeature: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 8,
    lineHeight: 24,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
  },
  imageModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: '90%',
    height: '80%',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});