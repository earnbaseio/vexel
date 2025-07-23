#!/usr/bin/env python3
"""
Debug script for Gemini Agent issues
"""

import os
import sys
import traceback
from dotenv import load_dotenv

# Add app to path
sys.path.append('/Users/tuan/Develop/personal/vexel/vexel/backend/app')

def test_basic_litellm():
    """Test basic LiteLLM functionality"""
    print("=" * 50)
    print("1. Testing Basic LiteLLM")
    print("=" * 50)
    
    try:
        import litellm
        
        response = litellm.completion(
            model='gemini/gemini-2.5-flash-lite',
            messages=[{'role': 'user', 'content': 'Hello, say hi back'}],
            api_key=os.getenv('GEMINI_API_KEY')
        )
        print("✅ Basic LiteLLM test successful!")
        print(f"Response: {response.choices[0].message.content}")
        return True
    except Exception as e:
        print(f"❌ Basic LiteLLM test failed: {e}")
        traceback.print_exc()
        return False

def test_agno_litellm():
    """Test Agno LiteLLM wrapper"""
    print("\n" + "=" * 50)
    print("2. Testing Agno LiteLLM Wrapper")
    print("=" * 50)
    
    try:
        from agno.models.litellm import LiteLLM
        
        llm = LiteLLM(
            id='gemini/gemini-2.5-flash-lite',
            api_key=os.getenv('GEMINI_API_KEY'),
            temperature=0.7
        )
        
        response = llm.invoke("Hello, say hi back")
        print("✅ Agno LiteLLM test successful!")
        print(f"Response: {response}")
        return True
    except Exception as e:
        print(f"❌ Agno LiteLLM test failed: {e}")
        traceback.print_exc()
        return False

def test_simple_agent():
    """Test simple Agno Agent"""
    print("\n" + "=" * 50)
    print("3. Testing Simple Agno Agent")
    print("=" * 50)
    
    try:
        from agno.models.litellm import LiteLLM
        from agno.agent import Agent
        
        llm = LiteLLM(
            id='gemini/gemini-2.5-flash-lite',
            api_key=os.getenv('GEMINI_API_KEY'),
            temperature=0.7
        )
        
        agent = Agent(
            name="TestAgent",
            model=llm,
            user_id="test_user",
            session_id="test_session",
            debug_mode=True
        )
        
        response = agent.run("Hello, say hi back")
        print("✅ Simple Agno Agent test successful!")
        print(f"Response: {response}")
        return True
    except Exception as e:
        print(f"❌ Simple Agno Agent test failed: {e}")
        traceback.print_exc()
        return False

def test_vexel_unified_agent():
    """Test VexelAgent"""
    print("\n" + "=" * 50)
    print("4. Testing VexelAgent")
    print("=" * 50)
    
    try:
        from app.agents.unified_agent import VexelAgent
        
        agent = VexelAgent(
            name="TestVexelAgent",
            model="gemini/gemini-2.5-flash-lite",
            user_id="test_user",
            session_id="test_session"
        )
        
        print("Agent created, testing chat...")
        response = agent.chat("Hello, say hi back")
        print("✅ VexelAgent test successful!")
        print(f"Response: {response}")
        return True
    except Exception as e:
        print(f"❌ VexelAgent test failed: {e}")
        traceback.print_exc()
        return False

def test_vexel_agent_with_knowledge():
    """Test VexelAgent with knowledge"""
    print("\n" + "=" * 50)
    print("5. Testing VexelAgent with Knowledge")
    print("=" * 50)
    
    try:
        from app.agents.unified_agent import VexelAgent
        
        # Create agent with knowledge source
        knowledge_sources = [{
            "type": "collection",
            "name": "Test Knowledge",
            "source_id": "test_collection_id",
            "enabled": True
        }]
        
        agent = VexelAgent(
            name="TestVexelKnowledgeAgent",
            model="gemini/gemini-2.5-flash-lite",
            user_id="test_user",
            session_id="test_session",
            knowledge_sources=knowledge_sources
        )
        
        print("Agent with knowledge created, testing chat...")
        response = agent.chat("What are the key features of Vexel AI platform?")
        print("✅ VexelAgent with knowledge test successful!")
        print(f"Response: {response[:200]}...")
        return True
    except Exception as e:
        print(f"❌ VexelAgent with knowledge test failed: {e}")
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("🔍 Debugging Gemini Agent Issues")
    print("=" * 60)
    
    # Load environment
    load_dotenv()
    
    print(f"GEMINI_API_KEY: {os.getenv('GEMINI_API_KEY', 'NOT SET')[:20]}...")
    
    # Run tests
    tests = [
        test_basic_litellm,
        test_agno_litellm,
        test_simple_agent,
        test_vexel_unified_agent,
        test_vexel_agent_with_knowledge
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    test_names = [
        "Basic LiteLLM",
        "Agno LiteLLM Wrapper", 
        "Simple Agno Agent",
        "VexelAgent",
        "VexelAgent with Knowledge"
    ]
    
    for i, (name, result) in enumerate(zip(test_names, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{i+1}. {name}: {status}")
    
    passed = sum(results)
    total = len(results)
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Gemini integration is working.")
    else:
        print("⚠️ Some tests failed. Check the detailed output above.")

if __name__ == "__main__":
    main()
