#!/usr/bin/env python3
"""
Test retry logic for Gemini Agent
"""

import os
import sys
from dotenv import load_dotenv

# Add app to path
sys.path.append('/Users/tuan/Develop/personal/vexel/vexel/backend/app')

def test_vexel_agent_retry():
    """Test VexelAgent with retry logic"""
    print("=" * 60)
    print("Testing VexelAgent with Retry Logic")
    print("=" * 60)
    
    try:
        from app.agents.unified_agent import VexelAgent
        
        # Create agent
        agent = VexelAgent(
            name="RetryTestAgent",
            model="gemini/gemini-2.5-flash-lite",
            user_id="retry_test_user",
            session_id="retry_test_session"
        )
        
        # Test multiple questions to trigger potential errors
        test_questions = [
            "Hello, how are you?",
            "What are the key features of Vexel AI platform?",
            "Explain machine learning in simple terms",
            "What is the weather like today?",
            "Tell me a short joke"
        ]
        
        success_count = 0
        total_questions = len(test_questions)
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n--- Question {i}/{total_questions} ---")
            print(f"Q: {question}")
            
            try:
                response = agent.chat(question)
                
                if "Error generating response" in response or "experiencing temporary issues" in response:
                    print(f"❌ Failed: {response[:100]}...")
                else:
                    print(f"✅ Success: {response[:100]}...")
                    success_count += 1
                    
            except Exception as e:
                print(f"❌ Exception: {e}")
        
        print(f"\n" + "=" * 60)
        print(f"RESULTS: {success_count}/{total_questions} questions answered successfully")
        print(f"Success rate: {(success_count/total_questions)*100:.1f}%")
        
        if success_count >= total_questions * 0.8:  # 80% success rate
            print("🎉 Retry logic working well!")
            return True
        else:
            print("⚠️ Retry logic needs improvement")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run retry logic test"""
    print("🔄 Testing Gemini Agent Retry Logic")
    
    # Load environment
    load_dotenv()
    
    print(f"GEMINI_API_KEY: {os.getenv('GEMINI_API_KEY', 'NOT SET')[:20]}...")
    
    # Run test
    success = test_vexel_agent_retry()
    
    if success:
        print("\n🎉 Retry logic test completed successfully!")
    else:
        print("\n❌ Retry logic test failed!")

if __name__ == "__main__":
    main()
