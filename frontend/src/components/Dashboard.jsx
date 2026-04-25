import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { curriculumData as initialData } from '../data/curriculum';
import LessonOverlay from './LessonOverlay';
import SurvivalOverlay from './SurvivalOverlay';
import ChatbotPanel from './ChatbotPanel';
import { API_URL } from '../config';

const XP_RULES = { mcq: 20, fill_blank: 30, coding: 50 };
const calcModuleXP = (mod) =>
  (mod.questions || []).reduce((sum, q) => sum + (XP_RULES[q.type || q.question_type] || 20), 0);

const MOCK_PROFILES = {
  NOVICE: {
    id: 1,
    name: "The Novice Student",
    xp: 0,
    level: 1,
    completed: [],
    unlockedSideQuests: []
  },
  INTERMEDIATE: {
    id: 2,
    name: "The Intermediate Student",
    xp: 3500,
    level: 18,
    completed: [
      "1:1.1 What is Programming?", "1:1.2 Variables", "1:1.3 Data Types", "1:1.4 Input / Output",
      "2:2.1 Conditions (if-else)", "2:2.2 Loops (for, while)", "2:2.3 Loop Practice",
      "3:3.1 Functions", "3:3.2 Parameters"
    ],
    unlockedSideQuests: [5]
  },
  ADVANCED: {
    id: 3,
    name: "The Advanced Student",
    xp: 7500,
    level: 38,
    completed: [
      "1:1.1 What is Programming?", "1:1.2 Variables", "1:1.3 Data Types", "1:1.4 Input / Output",
      "2:2.1 Conditions (if-else)", "2:2.2 Loops (for, while)", "2:2.3 Loop Practice",
      "3:3.1 Functions", "3:3.2 Parameters",
      "4:4.1 Lists",
      "5:5.1 HTML Structure", "5:5.2 HTML Tags & Elements",
      "6:6.1 CSS Selectors", "6:6.2 Box Model & Layout",
      "7:7.1 SELECT Queries", "7:7.2 INSERT & UPDATE"
    ],
    unlockedSideQuests: [5, 6, 7]
  }
};

const Dashboard = ({ onLogout, onViewStats, onViewSettings, onViewAchievements, onViewParentDashboard }) => {
  // ── 1. ALL STATE & REFS AT THE TOP ────────────────────────────────────────
  const containerRef = useRef(null);
  const statsRef = useRef(null);
  const minimapRef = useRef(null);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const [currentProfile, setCurrentProfile] = useState("NOVICE");
  const [scale, setScale] = useState(0.85);
  const [alert, setAlert] = useState(null);
  const videoRef = useRef(null);

  // Force play background video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.warn("Autoplay was prevented, waiting for user interaction:", err);
      });
    }
  }, []);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [activeLesson, setActiveLesson] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGeneratingLesson, setIsGeneratingLesson] = useState(false);
  const [generatingModuleTitle, setGeneratingModuleTitle] = useState("");
  const [isSurvivalModeOpen, setIsSurvivalModeOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecalibrating, setIsRecalibrating] = useState(false);
  const [failedQuestions, setFailedQuestions] = useState({}); // { nodeId: [questionIndices] }

  // Stats & Mastery State
  const [userStats, setUserStats] = useState(() => {
    try {
      const saved = localStorage.getItem('cortexai_userstats_v2');
      return saved ? JSON.parse(saved) : { xp: 0, level: 1, streak: 0 };
    } catch { return { xp: 0, level: 1, streak: 0 }; }
  });

  const [completedSubtopics, setCompletedSubtopics] = useState(() => {
    try {
      const saved = localStorage.getItem('cortexai_completed_subtopics_v2');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const [rlStats, setRlStats] = useState({ xp: 0, rank: "Novice", current_level: 1 });

  // Curriculum State Initialization
  const [curriculum, setCurriculum] = useState(() => {
    try {
      const saved = localStorage.getItem('cortexai_completed_subtopics_v2');
      const completed = saved ? new Set(JSON.parse(saved)) : new Set();
      const unlockedSideQuests = JSON.parse(localStorage.getItem('cortexai_unlocked_sidequests') || '[]');

      const firstPass = initialData.map(node => {
        const allDone = node.modules.every(m => completed.has(`${node.id}:${m.title}`));
        return allDone ? { ...node, status: 'mastered', progress: 100 } : node;
      });

      return firstPass.map(node => {
        if (node.status === 'mastered') return node;
        if (node.track_type === 'side_quest' && unlockedSideQuests.includes(node.id)) return { ...node, status: 'in_progress' };
        if (node.prerequisite_topic_id) {
          const prereq = firstPass.find(n => n.id === node.prerequisite_topic_id);
          if (prereq && prereq.status === 'mastered') return { ...node, status: 'in_progress' };
        }
        // First core node is unlocked by default
        if (node.id === 1 && node.status !== 'mastered') return { ...node, status: 'in_progress' };
        return node;
      });
    } catch { return initialData; }
  });

  // Position State
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  // Set initial position based on curriculum
  useEffect(() => {
    const target = curriculum.find(n => n.track_type === 'core' && n.status !== 'mastered') || curriculum[0];
    if (target) {
      setX(window.innerWidth / 2 - (target.position.x * 0.85));
      setY(window.innerHeight / 2 - (target.position.y * 0.85));
    }
  }, []); // Only once on mount

  // ── 2. PERSISTENCE EFFECTS ──────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('cortexai_userstats_v2', JSON.stringify(userStats));
  }, [userStats]);

  useEffect(() => {
    localStorage.setItem('cortexai_completed_subtopics_v2', JSON.stringify([...completedSubtopics]));
  }, [completedSubtopics]);

  // ── 3. HANDLERS ────────────────────────────────────────────────────────
  const handleProfileSwitch = (profileKey) => {
    const profile = MOCK_PROFILES[profileKey];
    if (!profile) return;

    setIsRecalibrating(true);
    setCurrentProfile(profileKey);

    // Give the UI a frame to show the loader
    setTimeout(() => {
      // 1. Update Completed Subtopics
      const newCompleted = new Set(profile.completed);
      setCompletedSubtopics(newCompleted);
      localStorage.setItem('cortexai_completed_subtopics_v2', JSON.stringify([...newCompleted]));

      // 2. Update Side Quests
      localStorage.setItem('cortexai_unlocked_sidequests', JSON.stringify(profile.unlockedSideQuests));

      // 3. Update User Stats
      const newStats = { xp: profile.xp, level: profile.level, streak: 3 };
      setUserStats(newStats);
      localStorage.setItem('cortexai_userstats_v2', JSON.stringify(newStats));

      // 4. Recalculate Curriculum Map
      const firstPass = initialData.map(node => {
        const allDone = node.modules.every(m => newCompleted.has(`${node.id}:${m.title}`));
        return allDone ? { ...node, status: 'mastered', progress: 100 } : { ...node, status: 'locked', progress: 0 };
      });

      const secondPass = firstPass.map(node => {
        if (node.status === 'mastered') return node;
        if (node.track_type === 'side_quest' && profile.unlockedSideQuests.includes(node.id)) return { ...node, status: 'in_progress' };
        if (node.prerequisite_topic_id) {
          const prereq = firstPass.find(n => n.id === node.prerequisite_topic_id);
          if (prereq && prereq.status === 'mastered') return { ...node, status: 'in_progress' };
        }
        if (node.id === 1 && node.status !== 'mastered') return { ...node, status: 'in_progress' };
        return node;
      });

      setCurriculum(secondPass);

      const startNode = secondPass.find(n => n.status === 'in_progress') || secondPass[0];
      setX(window.innerWidth / 2 - (startNode.position.x * scale));
      setY(window.innerHeight / 2 - (startNode.position.y * scale));

      // Snap the map immediately, then allow animations again
      setTimeout(() => setIsRecalibrating(false), 300);
    }, 100);
  };

  // Fetch RL Stats from backend


  const handleRecenter = () => {
    const target = curriculum.find(n => n.track_type === 'core' && n.status !== 'mastered') || curriculum[0];
    if (target) {
      // Account for the 96px sidebar (w-24) to center in the visible area
      const centerX = 96 + (window.innerWidth - 96) / 2;
      const centerY = window.innerHeight / 2;
      setX(centerX - (target.position.x * 0.85));
      setY(centerY - (target.position.y * 0.85));
      setScale(0.85);
    }
  };

  const jumpToNode = (nodeId) => {
    const target = curriculum.find(n => n.id === nodeId);
    if (target) {
      const centerX = 96 + (window.innerWidth - 96) / 2;
      const centerY = window.innerHeight / 2;
      setX(centerX - (target.position.x * 0.85));
      setY(centerY - (target.position.y * 0.85));
      setScale(0.85);
    }
  };

  const fetchRLStats = async () => {
    try {
      const studentId = MOCK_PROFILES[currentProfile].id;
      const res = await fetch(`${API_URL}/api/rl/student-progress/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setRlStats(data);
        setUserStats(prev => ({
          ...prev,
          xp: Math.max(prev.xp, data.xp),
          level: Math.max(prev.level, data.current_level)
        }));

        // Backwards-sync from backend to frontend localStorage
        let modified = false;
        const newCompleted = new Set(completedSubtopics);

        data.mastery?.forEach(m => {
          if (m.score >= 0.99) { // Mastered
            const node = initialData.find(n => n.id === m.topic_id);
            if (node) {
              node.modules.forEach(mod => {
                const key = `${node.id}:${mod.title}`;
                if (!newCompleted.has(key)) {
                  newCompleted.add(key);
                  modified = true;
                }
              });
            }
          }
        });

        if (modified) {
          setCompletedSubtopics(newCompleted);
          localStorage.setItem('cortexai_completed_subtopics_v2', JSON.stringify([...newCompleted]));

          const firstPass = initialData.map(node => {
            const allDone = node.modules.every(m => newCompleted.has(`${node.id}:${m.title}`));
            return allDone ? { ...node, status: 'mastered', progress: 100 } : node;
          });

          const secondPass = firstPass.map(node => {
            if (node.status === 'mastered') return node;
            const unlockedSideQuests = JSON.parse(localStorage.getItem('cortexai_unlocked_sidequests') || '[]');
            if (node.track_type === 'side_quest' && unlockedSideQuests.includes(node.id)) return { ...node, status: 'in_progress' };
            if (node.prerequisite_topic_id) {
              const prereq = firstPass.find(n => n.id === node.prerequisite_topic_id);
              if (prereq && prereq.status === 'mastered') return { ...node, status: 'in_progress' };
            }
            return node;
          });

          setCurriculum(secondPass);
        }
      }
    } catch (err) {
      console.error("Failed to fetch RL stats", err);
    }
  };

  useEffect(() => {
    // Only fetch from real backend if we are on the default Novice profile
    // Otherwise, the mock data will be overwritten by student 1's real stats
    if (currentProfile === "NOVICE") {
      fetchRLStats();
    }
  }, [isSurvivalModeOpen, currentProfile]); // Refresh stats when closing survival mode or switching profiles

  useEffect(() => {
    localStorage.setItem('cortexai_userstats_v2', JSON.stringify(userStats));
  }, [userStats]);

  // Sync curriculum with RL Mastery
  useEffect(() => {
    if (!rlStats.mastery) return;

    setCurriculum(prev => {
      let nextCurriculum = [...prev];
      
      // 1. Update mastered status for core nodes
      nextCurriculum = nextCurriculum.map(node => {
        const record = rlStats.mastery.find(m => m.topic_id === node.id);
        if (record && record.score >= 0.7) {
          return { ...node, status: 'mastered', progress: 100 };
        }
        return node;
      });
      
      // 2. Handle Chatbot-triggered Revision Quests
      rlStats.mastery.forEach(record => {
        const coreNode = nextCurriculum.find(n => n.id === record.topic_id && n.track_type === 'core');
        if (!coreNode) return;
        
        const revisionNodeId = 1000 + record.topic_id;
        const hasExistingRevision = nextCurriculum.some(n => n.id === revisionNodeId);
        
        if (record.score < 0.5) {
          // Add revision quest if it doesn't exist
          if (!hasExistingRevision) {
            const revisionNode = {
              id: revisionNodeId,
              subject: coreNode.subject,
              chapter: "Revision",
              sub_chapter: "Chatbot Insight",
              topic_name: `Remediation: ${coreNode.topic_name}`,
              difficulty_level: 'easy',
              track_type: 'side_quest',
              status: 'in_progress',
              progress: 0,
              xp_reward: 50,
              position: { x: coreNode.position.x + 800, y: coreNode.position.y },
              prerequisite_topic_id: record.topic_id,
              modules: [{
                title: `Review Chat Concepts: ${coreNode.topic_name}`,
                description: `Krith noticed you asked about ${coreNode.topic_name}. Complete this quick revision to strengthen your neural pathways!`,
                theory: `### CHATBOT RECALIBRATION\n\nYour recent conversations with Krith indicated a drop in your neural resonance for **${coreNode.topic_name}**.\n\nTake a deep breath and review the core principles before jumping back into the main track.`,
                questions: coreNode.modules.flatMap(m => m.questions || []).slice(0, 3)
              }]
            };
            
            // Point downstream nodes to the new revision node and lock them
            nextCurriculum = nextCurriculum.map(n => {
              if (n.prerequisite_topic_id === record.topic_id) {
                return { ...n, prerequisite_topic_id: revisionNodeId, status: 'locked' };
              }
              return n;
            });
            
            nextCurriculum.push(revisionNode);
          }
        } else {
          // If score >= 0.5, silently remove the revision quest if it exists
          if (hasExistingRevision) {
            nextCurriculum = nextCurriculum.filter(n => n.id !== revisionNodeId);
            nextCurriculum = nextCurriculum.map(n => {
              if (n.prerequisite_topic_id === revisionNodeId) {
                return { ...n, prerequisite_topic_id: record.topic_id };
              }
              return n;
            });
          }
        }
      });
      
      return nextCurriculum;
    });
  }, [rlStats.mastery]);

  // CLOSE STATS ON CLICK OUTSIDE
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statsRef.current && !statsRef.current.contains(event.target)) {
        setShowStats(false);
      }
    };
    if (showStats) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStats]);



  const handleSubtopicComplete = (nodeId, moduleTitle, earnedXP = 0, results = []) => {
    // Record failures for revision path
    if (results && results.length > 0) {
      const wrongIndices = results.map((r, i) => r.isCorrect ? null : i).filter(i => i !== null);
      if (wrongIndices.length > 0) {
        setFailedQuestions(prev => {
          const modIndex = curriculum.find(n => n.id === nodeId)?.modules.findIndex(m => m.title === moduleTitle);
          return {
            ...prev,
            [nodeId]: [...(prev[nodeId] || []), modIndex]
          };
        });
      }
    }
    const node = curriculum.find(n => n.id === nodeId);
    if (!node) return;

    // 2. Mark this subtopic as complete
    const key = `${nodeId}:${moduleTitle}`;
    const newCompleted = new Set([...completedSubtopics, key]);
    setCompletedSubtopics(newCompleted);

    // 3. Check if ALL subtopics in this node are now done
    const allDone = node.modules.every(m => newCompleted.has(`${nodeId}:${m.title}`));
    const progressPercent = node.modules.filter(m => newCompleted.has(`${nodeId}:${m.title}`)).length / node.modules.length;

    // 1. Sync XP and mastery to backend database (so Parent Dashboard shows real data)
    if (earnedXP > 0 || progressPercent > 0) {
      fetch(`${API_URL}/api/rl/log-xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 1,
          xp_earned: earnedXP,
          source: 'lesson',
          topic_id: nodeId >= 1000 ? nodeId - 1000 : nodeId,
          mastery_score: progressPercent
        })
      }).catch(err => console.warn('Sync to DB failed:', err));
    }

    // 2. Add XP to user stats immediately + update streak
    setUserStats(prev => {
      const newXP = prev.xp + earnedXP;
      const today = new Date().toDateString();
      const lastActive = localStorage.getItem('cortexai_last_active');
      let newStreak = prev.streak || 0;
      if (lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        newStreak = (lastActive === yesterday.toDateString()) ? newStreak + 1 : 1;
        localStorage.setItem('cortexai_last_active', today);
      }
      return { ...prev, xp: newXP, level: Math.floor(newXP / 200) + 1, streak: newStreak };
    });

    // 3. Trigger/Update Remediation logic
    const hasFailures = results.some(r => !r.isCorrect);
    
    setCurriculum(prev => {
      let nextCurriculum = [...prev];

      // If they passed with mistakes, inject/update remediation (only for core nodes)
      if (hasFailures && nodeId < 1000) {
        const revisionNodeId = 1000 + nodeId;
        const revisionNode = {
          id: revisionNodeId,
          topic_name: `Remediation: ${node.topic_name}`,
          track_type: 'side_quest',
          difficulty_level: 'Medium',
          status: 'in_progress',
          progress: 0,
          xp_reward: 50,
          position: { x: node.position.x + 800, y: node.position.y },
          prerequisite_topic_id: nodeId,
          modules: [{
            title: `Fix Mistakes: ${moduleTitle}`,
            questions: node.modules.find(m => m.title === moduleTitle).questions,
            theory: `### ADAPTIVE REMEDIATION\nThe RL engine has detected a gap in your understanding. You must clear this quest to unlock the next module.`
          }]
        };

        nextCurriculum = nextCurriculum.map(n => {
          // Block the next core node
          if (n.prerequisite_topic_id === nodeId && n.track_type === 'core') {
            return { ...n, prerequisite_topic_id: revisionNodeId, status: 'locked' };
          }
          // Update current node progress but don't master it yet
          if (n.id === nodeId) {
            return { ...n, status: 'in_progress', progress: progressPercent * 100 };
          }
          return n;
        }).concat(revisionNode);

        setAlert("PATH RECALIBRATED: REMEDIATION QUEST INJECTED");
        setTimeout(() => setAlert(null), 3000);
      } else {
        // Successful completion logic
        if (nodeId >= 1000) {
          const originalNodeId = nodeId - 1000;
          // 1. Remove the remediation quest from the map
          nextCurriculum = nextCurriculum.filter(n => n.id !== nodeId);
          // 2. Point all downstream nodes back to the original node and unlock them
          nextCurriculum = nextCurriculum.map(n => {
            if (n.prerequisite_topic_id === nodeId) {
              return { ...n, prerequisite_topic_id: originalNodeId, status: 'in_progress' };
            }
            return n;
          });
          // 3. Clear failures for the original node so it doesn't re-trigger
          setFailedQuestions(prev => {
            const newState = { ...prev };
            delete newState[originalNodeId];
            return newState;
          });
          // 4. Mark the original node as mastered if all its modules are now clear
          nextCurriculum = nextCurriculum.map(n => {
            if (n.id === originalNodeId) {
              const isMasteredNow = n.modules.every(m => newCompleted.has(`${originalNodeId}:${m.title}`));
              const currentProgress = (n.modules.filter(m => newCompleted.has(`${originalNodeId}:${m.title}`)).length / n.modules.length) * 100;
              return { ...n, status: isMasteredNow ? 'mastered' : 'in_progress', progress: currentProgress };
            }
            return n;
          });
        } else {
          // Standard core node completion
          nextCurriculum = nextCurriculum.map(n => {
            if (n.id === nodeId) {
              return { ...n, status: allDone ? 'mastered' : n.status, progress: progressPercent * 100 };
            }
            // If this was a prerequisite for something locked, unlock it
            if (allDone && n.prerequisite_topic_id === nodeId && n.status === 'locked') {
              return { ...n, status: 'in_progress' };
            }
            return n;
          });

          // NEW: If the student just perfected a module that previously had remediation,
          // check if we can remove that remediation node now.
          if (!hasFailures) {
            const revisionNodeId = 1000 + nodeId;
            const hasExistingRevision = nextCurriculum.some(n => n.id === revisionNodeId);
            if (hasExistingRevision) {
              // Remove the revision node and point downstream back to original
              nextCurriculum = nextCurriculum.filter(n => n.id !== revisionNodeId);
              nextCurriculum = nextCurriculum.map(n => {
                if (n.prerequisite_topic_id === revisionNodeId) {
                  return { ...n, prerequisite_topic_id: nodeId };
                }
                return n;
              });
            }
          }
        }

        if (allDone) {
          setActiveLesson(null);
          setSelectedNode(null);
        }
      }

      return nextCurriculum;
    });

    // Auto-open the next unfinished subtopic in this level IF this one was passed
    if (!hasFailures) {
      const currentIndex = node.modules.findIndex(m => m.title === moduleTitle);
      const nextMod = node.modules[currentIndex + 1];
      if (nextMod) {
        handleStartModule(node, nextMod);
      } else {
        setActiveLesson(null);
      }
    }
  };

  const handleUnlockSideQuest = (nodeId) => {
    const node = curriculum.find(n => n.id === nodeId);
    if (!node) return;

    if (userStats.xp < node.xp_required) {
      setAlert("INSUFFICIENT XP TO BREAK THIS SEAL");
      setTimeout(() => setAlert(null), 2000);
      return;
    }

    setUserStats(prev => ({ ...prev, xp: prev.xp - node.xp_required }));
    setCurriculum(prev => prev.map(n =>
      n.id === nodeId ? { ...n, status: 'in_progress' } : n
    ));
    setAlert(`SEAL BROKEN: ${node.topic_name} ACQUIRED`);
    setTimeout(() => setAlert(null), 3000);
  };

  const handleStartModule = async (node, mod) => {
    setIsGeneratingLesson(true);
    setGeneratingModuleTitle(mod.title);

    try {
      const res = await fetch(`${API_URL}/api/questions/generate-lesson`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: mod.title, difficulty: node.difficulty_level })
      });

      if (!res.ok) throw new Error('Generation failed');

      const data = await res.json();

      setActiveLesson({
        topic: mod.title,
        difficulty: node.difficulty_level,
        nodeId: node.id,
        xpReward: node.xp_reward,
        preWrittenTheory: data.theory,
        preWrittenQuestions: data.questions
      });
    } catch (err) {
      console.error('Failed to generate dynamic lesson, falling back to static data:', err);
      // Fallback to static data
      setActiveLesson({
        topic: mod.title,
        difficulty: node.difficulty_level,
        nodeId: node.id,
        xpReward: node.xp_reward,
        preWrittenTheory: mod.theory,
        preWrittenQuestions: mod.questions
      });
    } finally {
      setIsGeneratingLesson(false);
      setGeneratingModuleTitle("");
    }
  };



  const handlePointerDown = (e) => {
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX - x, y: e.clientY - y };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartPos.current.x - x;
    const dy = e.clientY - dragStartPos.current.y - y;
    setX(x + dx * 0.85);
    setY(y + dy * 0.85);
  };

  const handlePointerUp = () => setIsDragging(false);

  // ── Stable-ref zoom: listener registered once, always reads latest values ──
  const wheelStateRef = useRef({ scale, x, y, selectedNode });
  useEffect(() => {
    wheelStateRef.current = { scale, x, y, selectedNode };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = (e) => {
      const { scale: s, x: cx, y: cy, selectedNode: sn } = wheelStateRef.current;
      if (sn) return;
      e.preventDefault();
      const zoomSpeed = 0.005;
      const minScale = 0.3;
      const maxScale = 1.5;
      const delta = -e.deltaY;
      const newScale = Math.min(Math.max(s + delta * zoomSpeed * s, minScale), maxScale);
      if (newScale !== s) {
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const scaleRatio = newScale / s;
        setScale(newScale);
        setX(mouseX - (mouseX - cx) * scaleRatio);
        setY(mouseY - (mouseY - cy) * scaleRatio);
      }
    };
    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, []); // registered ONCE — no stale-closure gap

  const isNodeVisible = (node) => {
    return true; // All modules are visible on the map, locked ones will show as locked
  };




  const minimapScale = 0.012;
  const miniOffsetX = 10;
  const miniOffsetY = 45;

  const miniViewportWidth = window.innerWidth / scale * minimapScale;
  const miniViewportHeight = window.innerHeight / scale * minimapScale;
  const miniX = (-x / scale);
  const miniY = (-y / scale);

  const handleMinimapInteraction = (e) => {
    const rect = minimapRef.current.getBoundingClientRect();
    const clickX = (e.clientX - rect.left - miniOffsetX) / minimapScale;
    const clickY = (e.clientY - rect.top - miniOffsetY) / minimapScale;

    const clickedNode = curriculum.find(n => {
      const dx = Math.abs(n.position.x - clickX);
      const dy = Math.abs(n.position.y - clickY);
      return dx < 300 && dy < 300;
    });

    if (clickedNode && !isNodeVisible(clickedNode)) {
      setAlert("DEFEAT THE BEFORE BOSS TO UNLOCK THIS SECTOR");
      setTimeout(() => setAlert(null), 3000);
      return;
    }

    if (clickedNode && isNodeVisible(clickedNode)) {
      setSelectedNode(clickedNode);
    }
    setX(window.innerWidth / 2 - (clickX * scale));
    setY(window.innerHeight / 2 - (clickY * scale));
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="w-screen h-screen font-body-standard text-primary overflow-hidden relative select-none"
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover opacity-10 -z-10 pointer-events-none"
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>



      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-10 py-6 bg-warm-cream/80 backdrop-blur-md border-b-2 border-stone-200/50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-white">bolt</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-black uppercase italic">CortexAI</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center bg-white border-2 border-black rounded-2xl p-1 px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="material-symbols-outlined text-stone-400 text-sm ml-2">person</span>
            <select
              value={currentProfile}
              onChange={(e) => handleProfileSwitch(e.target.value)}
              className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest p-2 outline-none cursor-pointer"
            >
              {Object.keys(MOCK_PROFILES).map(key => (
                <option key={key} value={key}>{MOCK_PROFILES[key].name}</option>
              ))}
            </select>
          </div>

          <div className="relative" ref={statsRef}>
            <button
              onClick={onViewAchievements}
              className="flex items-center gap-3 bg-white border-2 border-black px-6 py-3 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all hover:bg-stone-50"
            >
              <div className="flex items-center gap-2 border-r-2 border-stone-100 pr-4">
                <span className="material-symbols-outlined text-matcha-600 font-black">stars</span>
                <span className="text-sm font-black">{userStats.xp} XP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-orange-500 font-black">local_fire_department</span>
                <span className="text-sm font-black">{userStats.streak} DAY</span>
              </div>
            </button>

            <AnimatePresence>
              {showStats && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-[calc(100%+20px)] right-0 w-72 bg-white border-2 border-black rounded-[32px] shadow-[20px_20px_60px_rgba(0,0,0,0.1)] p-8 z-[100]"
                >
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center">
                        <span className="text-white font-black text-xl">{userStats.level}</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Current Level</p>
                        <h4 className="font-black text-lg leading-none">Level {userStats.level}</h4>
                      </div>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((userStats?.xp || 0) % 200) / 2}%` }}
                        className="h-full bg-matcha-500"
                      />
                    </div>
                    <div className="flex justify-center">
                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 text-center w-full">
                        <p className="text-[10px] font-black text-stone-400 uppercase mb-1">Streak</p>
                        <p className="text-sm font-black">{userStats.streak} Days</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-stone-400 text-center">7-Day Activity Monitor</p>
                      <div className="flex justify-between items-center gap-1">
                        {[0, 1, 1, 0, 1, 1, 1].map((active, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }} className={`w-7 h-7 rounded-lg border ${active ? 'bg-matcha-500 border-matcha-600 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-stone-100 border-stone-200'}`} />
                            <span className="text-[7px] font-black text-stone-300 uppercase">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={onLogout} className="w-12 h-12 rounded-full bg-white border-2 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none">
            <span className="material-symbols-outlined font-black">logout</span>
          </button>
        </div>
      </header>



      <aside className="fixed top-[94px] bottom-0 left-0 w-24 bg-warm-cream/80 backdrop-blur-md border-r-2 border-stone-200/50 z-50 flex flex-col items-center py-10 gap-10">
        {['Curriculum', 'Stats', 'Achievements', 'Settings'].map((item, idx) => (
          <div key={item} className="relative group flex flex-col items-center gap-2">
            <motion.a
              onClick={(e) => {
                e.preventDefault();
                if (item === 'Stats') onViewStats();
                if (item === 'Achievements') onViewAchievements();
                if (item === 'Settings') onViewSettings();
              }}
              whileHover={{ scale: 1.1 }}
              className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${idx === 0 ? 'bg-black text-white shadow-lg' : 'text-stone-300 hover:text-black hover:bg-stone-50'}`}
              href="#"
            >
              <span className="material-symbols-outlined text-2xl">{['school', 'bar_chart', 'emoji_events', 'settings'][idx]}</span>
            </motion.a>
            <span className="absolute left-[80px] bg-black text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-xl border border-white/10">{item}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-stone-300 mt-1 opacity-0 group-hover:opacity-100 transition-all">{item}</span>
          </div>
        ))}
      </aside>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 24 * 4 }}
            exit={{ x: -400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            className="fixed top-[94px] bottom-0 left-0 w-96 bg-white z-[40] shadow-[30px_0_60px_rgba(0,0,0,0.1)] border-r-2 border-stone-100 flex flex-col p-10 overflow-y-auto overscroll-contain"
          >
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-2">{selectedNode.chapter}</p>
                <h2 className="font-['Epilogue'] font-black text-3xl leading-tight">{selectedNode.topic_name}</h2>
              </div>
              <button onClick={() => setSelectedNode(null)} className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center hover:bg-black hover:text-white transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-6">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Mission Parameters</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100"><p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Difficulty</p><p className="text-xs font-black uppercase tracking-widest">{selectedNode.difficulty_level}</p></div>
                <div className="p-4 bg-matcha-50 rounded-2xl border border-matcha-100"><p className="text-[10px] font-bold text-matcha-600 uppercase mb-1">Total XP Potential</p><p className="text-xs font-black text-matcha-600">{selectedNode.modules.reduce((s, m) => s + calcModuleXP(m), 0)} XP</p></div>
              </div>
              <div className="space-y-4 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400">Core Modules</p>
                {selectedNode.modules.map((mod, i) => {
                  const isDone = completedSubtopics.has(`${selectedNode.id}:${mod.title}`);
                  return (
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      onClick={() => setActiveLesson({
                        topic: mod.title,
                        difficulty: selectedNode.difficulty_level,
                        nodeId: selectedNode.id,
                        xpReward: selectedNode.xp_reward,
                        preWrittenTheory: mod.theory,
                        preWrittenQuestions: mod.questions
                      })}
                      className={`flex items-center gap-4 p-4 rounded-[20px] border group cursor-pointer transition-all ${isDone
                        ? 'bg-green-50 border-green-200 hover:border-green-500'
                        : 'bg-stone-50 border-stone-100 hover:border-black'
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all shrink-0 ${isDone
                        ? 'bg-green-500 text-white'
                        : 'bg-white border border-stone-200 text-stone-400 group-hover:bg-black group-hover:text-white'
                        }`}>
                        {isDone
                          ? <span className="material-symbols-outlined text-sm">check</span>
                          : i + 1
                        }
                      </div>
                      <span className={`text-sm font-bold truncate ${isDone ? 'text-green-700 line-through opacity-70' : 'text-stone-600 group-hover:text-black'
                        }`}>
                        {mod.title}
                      </span>
                      {isDone && <span className="ml-auto text-[9px] font-black text-green-600 uppercase tracking-widest shrink-0">Done ✓</span>}
                      {!isDone && <span className="ml-auto text-[9px] font-black text-stone-300 shrink-0">+{calcModuleXP(mod)} XP</span>}
                    </motion.div>
                  );
                })}
              </div>
              {/* Progress indicator */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">
                  <span>Progress</span>
                  <span>{selectedNode.modules.filter(m => completedSubtopics.has(`${selectedNode.id}:${m.title}`)).length} / {selectedNode.modules.length}</span>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(selectedNode.modules.filter(m => completedSubtopics.has(`${selectedNode.id}:${m.title}`)).length / selectedNode.modules.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {alert && (
          <motion.div initial={{ y: -50, opacity: 0, x: '-50%' }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="fixed top-32 left-1/2 z-[100] px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(220,38,38,0.3)] border-2 border-white/20">
            {alert}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGeneratingLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <div className="flex gap-2 mb-6">
              <div className="w-4 h-4 bg-matcha-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-4 h-4 bg-matcha-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-4 h-4 bg-matcha-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-center">Generating Customized Mission...</h2>
            <p className="text-stone-500 font-bold mt-2 text-center max-w-sm">
              Krith is building a unique '{generatingModuleTitle}' curriculum for you right now.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <main onPointerDown={handlePointerDown} className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing z-0 pl-24">

        <div style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, transition: (isDragging || isRecalibrating) ? 'none' : 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' }} className="absolute origin-top-left">
          <div className="relative min-w-[12000px] min-h-[5000px]">
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {curriculum
                .map((node) => {
                  if (!node.prerequisite_topic_id) return null;
                  const prereq = curriculum.find(n => n.id === node.prerequisite_topic_id);
                  if (!prereq || !isNodeVisible(node)) return null;
                  const isMastered = node.status === 'mastered';
                  const angle = Math.atan2(node.position.y - prereq.position.y, node.position.x - prereq.position.x);
                  const offset = 220;
                  const endX = node.position.x - Math.cos(angle) * offset;
                  const endY = node.position.y - Math.sin(angle) * offset;
                  const startX = prereq.position.x + Math.cos(angle) * 220;
                  const startY = prereq.position.y + Math.sin(angle) * 220;
                  const d = `M ${startX} ${startY} C ${(startX + endX) / 2} ${startY}, ${(startX + endX) / 2} ${endY}, ${endX} ${endY}`;
                  return <path key={`line-${node.id}`} d={d} fill="none" stroke={isMastered ? '#5d4037' : '#d6d3d1'} strokeWidth="16" strokeDasharray={isMastered ? "0" : "20,20"} className="transition-all duration-1000" />
                })}
            </svg>
            <AnimatePresence>
              {curriculum.map((node, i) => {
                if (!isNodeVisible(node)) return null;

                const isMastered = node.status === 'mastered';
                const isSideQuest = node.track_type === 'side_quest';
                const isLocked = node.status === 'locked';
                const canAfford = userStats.xp >= (node.xp_required || 0);

                const subjectStyles = {
                  'Python': { border: 'border-8 border-[#5d4037]', bg: 'bg-[#faf7f2]', iconBg: 'bg-[#5d4037]', glow: 'shadow-[24px_24px_0px_0px_rgba(93,64,55,0.25)]' },
                  'Web': { border: 'border-8 border-[#5d4037]', bg: 'bg-[#faf7f2]', iconBg: 'bg-[#5d4037]', glow: 'shadow-[24px_24px_0px_0px_rgba(93,64,55,0.25)]' },
                  'CSS': { border: 'border-8 border-[#5d4037]', bg: 'bg-[#faf7f2]', iconBg: 'bg-[#5d4037]', glow: 'shadow-[24px_24px_0px_0px_rgba(93,64,55,0.25)]' },
                  'SQL': { border: 'border-8 border-[#5d4037]', bg: 'bg-[#faf7f2]', iconBg: 'bg-[#5d4037]', glow: 'shadow-[24px_24px_0px_0px_rgba(93,64,55,0.25)]' },
                };

                const currentStyle = (node.id === 6) ? subjectStyles['CSS'] : (subjectStyles[node.subject] || subjectStyles['Python']);


// ── Core Node Card (original) ───────────────────────────────
const coreStyles = isLocked
  ? { border: 'border-8 border-[#5d4037]', bg: 'bg-[#faf7f2]', icon: 'lock', opacity: 'opacity-100', glow: 'shadow-none' }
  : { border: currentStyle.border, bg: currentStyle.bg, icon: 'code', opacity: 'opacity-100', glow: currentStyle.glow };

return (
  <motion.div
    key={node.id}
    onClick={() => {
      if (isLocked) {
        setAlert("DEFEAT PREVIOUS MISSIONS TO UNLOCK THIS SECTOR");
        setTimeout(() => setAlert(null), 2000);
        return;
      }
      setSelectedNode(node);
    }}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={`absolute w-[450px] ${coreStyles.bg} rounded-[48px] ${coreStyles.border} p-12 z-20 ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer ' + (coreStyles.glow || 'shadow-[24px_24px_0px_0px_rgba(0,0,0,1)]') + ' hover:shadow-2xl hover:z-30'} ${coreStyles.opacity} transition-all`}
    style={{ left: node.position.x, top: node.position.y, transform: 'translate(-50%, -50%)' }}
  >
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className={`w-16 h-16 rounded-[24px] ${coreStyles.bg} border-2 border-black/10 flex items-center justify-center shadow-lg`}>
          <span className="material-symbols-outlined text-black/40 text-4xl font-black">{coreStyles.icon}</span>
        </div>
        {isMastered && <div className="bg-[#5d4037] w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-4 border-white"><span className="material-symbols-outlined text-white text-2xl font-black">check</span></div>}
      </div>
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.5em] text-orange-400/70 mb-2">{node.chapter}</p>
        <h3 className="font-['Epilogue'] font-black text-3xl text-orange-600 leading-tight tracking-tight mb-4">{node.topic_name}</h3>

        {/* Progress HUD */}
        <div className="flex items-center gap-4 bg-black/5 p-3 rounded-2xl border border-black/5">
          <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${node.progress}%` }}
              className={`h-full ${isMastered ? 'bg-green-500' : 'bg-orange-500'}`}
            />
          </div>
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
            {node.progress}%
          </span>
        </div>
      </div>
      <div className="space-y-4">
        {node.modules.map((mod, mi) => (
          <div
            key={mi}
            onClick={(e) => {
              e.stopPropagation();
              if (isLocked) return;
              setActiveLesson({
                topic: mod.title,
                difficulty: node.difficulty_level,
                nodeId: node.id,
                xpReward: node.xp_reward,
                preWrittenTheory: mod.theory,
                preWrittenQuestions: mod.questions
              });
            }}
            className={`flex flex-col gap-2 p-4 rounded-[20px] border transition-all group/mod ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'} ${completedSubtopics.has(`${node.id}:${mod.title}`)
              ? 'bg-green-50 border-green-200'
              : 'bg-stone-50 border-stone-100 hover:border-[#5d4037]'
              }`}
          >
            <div className="flex items-center gap-4">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${completedSubtopics.has(`${node.id}:${mod.title}`)
                ? 'bg-green-500 text-white'
                : 'bg-white border border-stone-100 text-stone-300 group-hover/mod:bg-black group-hover/mod:text-white transition-all'
                }`}>
                {completedSubtopics.has(`${node.id}:${mod.title}`)
                  ? <span className="material-symbols-outlined text-sm">check</span>
                  : mod.title.split(' ')[0]
                }
              </span>
              <span className={`text-sm font-bold truncate ${completedSubtopics.has(`${node.id}:${mod.title}`)
                ? 'text-green-700 line-through opacity-60'
                : 'text-orange-500 group-hover/mod:text-orange-600 transition-colors'
                }`}>
                {mod.title.split(' ').slice(1).join(' ')}
              </span>
              {completedSubtopics.has(`${node.id}:${mod.title}`) && (
                <span className="ml-auto text-[9px] font-black text-green-600 uppercase tracking-widest shrink-0">✓</span>
              )}
            </div>

            {/* Revision Trigger */}
            {failedQuestions[node.id]?.includes(mi) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLesson({
                    topic: mod.title,
                    difficulty: node.difficulty_level,
                    nodeId: node.id,
                    xpReward: Math.round(node.xp_reward / 2),
                    preWrittenTheory: `### REVISION MODE\nThis mission focuses exclusively on the logic you missed earlier. Let's recalibrate your understanding of **${mod.title}**.`,
                    preWrittenQuestions: mod.questions,
                    isRevision: true
                  });
                }}
                className="ml-12 px-3 py-1 bg-red-50 text-red-600 border border-red-100 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all w-fit flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[12px]">refresh</span>
                Start Revision Quest
              </button>
            )}
          </div>
        ))}
      </div>
      {/* Core Node Navigation Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-stone-100/10 mt-2">
        <button
          onClick={(e) => { e.stopPropagation(); jumpToNode(node.prerequisite_topic_id); }}
          disabled={!node.prerequisite_topic_id}
          className={`w-12 h-12 rounded-full border-2 border-[#5d4037] flex items-center justify-center transition-all ${node.prerequisite_topic_id ? 'bg-orange-500 text-white shadow-[4px_4px_0px_0px_#5d4037] hover:bg-orange-600 active:shadow-none' : 'bg-stone-50 text-stone-200 border-stone-100 cursor-not-allowed'}`}
          title="Previous Mission"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <div className="flex flex-col items-center gap-1">
          {node.id === 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); jumpToNode(5); }}
              className="w-12 h-12 rounded-full border-2 border-[#5d4037] bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-all shadow-[4px_4px_0px_0px_#5d4037] active:shadow-none mb-1"
              title="Jump to Web Sector"
            >
              <span className="material-symbols-outlined text-lg">arrow_upward</span>
            </button>
          )}
          <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Potential</p>
          <p className="text-xl font-black text-orange-600">{node.xp_reward} XP</p>
        </div>

        {(() => {
          const nextNode = curriculum.find(n => n.prerequisite_topic_id === node.id);
          return (
            <button
              onClick={(e) => { e.stopPropagation(); if (nextNode) jumpToNode(nextNode.id); }}
              disabled={!nextNode}
              className={`w-12 h-12 rounded-full border-2 border-[#5d4037] flex items-center justify-center transition-all ${nextNode ? 'bg-orange-500 text-white shadow-[4px_4px_0px_0px_#5d4037] hover:bg-orange-600 active:shadow-none' : 'bg-stone-50 text-stone-200 border-stone-100 cursor-not-allowed'}`}
              title="Next Mission"
            >
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          );
        })()}
      </div>
    </div>
  </motion.div>
);

              })}
            </AnimatePresence >
          </div >
        </div >
      </main >

  {/* Lesson Overlay — mounts when a module is clicked */ }
{
  activeLesson && (
    <LessonOverlay
      key={activeLesson.topic}
      topic={activeLesson.topic}
      difficulty={activeLesson.difficulty}
      preWrittenTheory={activeLesson.preWrittenTheory}
      preWrittenQuestions={activeLesson.preWrittenQuestions}
      xpReward={activeLesson.xpReward}
      onClose={() => setActiveLesson(null)}
      onFinish={(earnedXP, results) => {
        handleSubtopicComplete(activeLesson.nodeId, activeLesson.topic, earnedXP, results);
      }}
    />
  )
}

{/* Floating Chatbot Button */ }
<div className="fixed bottom-10 right-10 flex gap-4 z-50">
  <button
    className="w-16 h-16 bg-white border-2 border-black rounded-[20px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all group active:translate-y-0 active:shadow-none"
    onClick={handleRecenter}
    title="Recenter Map"
  >
    <span className="material-symbols-outlined text-black text-3xl font-black group-hover:rotate-180 transition-transform duration-500">my_location</span>
  </button>

  <button
    className="w-16 h-16 bg-blue-600 rounded-[20px] shadow-[6px_6px_0px_0px_rgba(37,99,235,0.4)] flex items-center justify-center hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(37,99,235,0.4)] transition-all group border-2 border-transparent hover:border-blue-400"
    onClick={() => setIsSurvivalModeOpen(true)}
    title="Adaptive Survival Mode"
  >
    <span className="text-3xl group-hover:animate-pulse">🏹</span>
  </button>

  <button
    className="w-16 h-16 bg-black rounded-[20px] shadow-[6px_6px_0px_0px_rgba(7,138,82,1)] flex items-center justify-center hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_rgba(7,138,82,1)] transition-all group border-2 border-transparent hover:border-matcha-500"
    onClick={() => setIsChatOpen(true)}
  >
    <span className="material-symbols-outlined text-white text-3xl font-black group-hover:animate-bounce">smart_toy</span>
  </button>
</div>

{/* Chatbot Panel */ }
  <ChatbotPanel
    isOpen={isChatOpen}
    onClose={() => setIsChatOpen(false)}
    userContext={{
      xp: userStats.xp,
      level: userStats.level,
      rank: rlStats.rank,
      modulesCompleted: completedSubtopics.size,
      completedModulesList: Array.from(completedSubtopics),
      struggleAreas: Object.keys(failedQuestions),
      currentTopic: selectedNode ? selectedNode.topic_name : 'Exploring Map'
    }}
  />


      <AnimatePresence>
        {isSurvivalModeOpen && (
          <SurvivalOverlay
            userStats={userStats}
            onClose={() => setIsSurvivalModeOpen(false)}
            onXPUpdate={(data) => {
              console.log("Survival Sync Request:", data);
              const { total_xp, mastery_updated, topic_id, xp_change } = data;

              // Safely add XP delta to the global userStats instead of overwriting with backend total
              if (xp_change !== undefined) {
                setUserStats(prev => {
                  const newXP = Math.max(0, prev.xp + xp_change);
                  return {
                    ...prev,
                    xp: newXP,
                    level: Math.floor(newXP / 200) + 1
                  };
                });
              } else if (total_xp !== undefined) {
                // Fallback
                setUserStats(prev => ({
                  ...prev,
                  xp: Math.max(prev.xp, total_xp),
                  level: Math.floor(Math.max(prev.xp, total_xp) / 200) + 1
                }));
              }

              if (total_xp !== undefined) {
                const newTotalXP = Math.max(0, total_xp);
                setRlStats(prev => ({ ...prev, xp: newTotalXP }));
              }

              if (mastery_updated !== undefined && topic_id) {
                setRlStats(prev => {
                  const newMastery = [...(prev.mastery || [])];
                  const idx = newMastery.findIndex(m => m.topic_id === topic_id);
                  if (idx !== -1) newMastery[idx] = { ...newMastery[idx], score: mastery_updated };
                  else newMastery.push({ topic_id, score: mastery_updated });
                  return { ...prev, mastery: newMastery };
                });
              }
            }}
          />
        )}


        {isRecalibrating && (
          <motion.div

          key="recalibrator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-6"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-4 border-matcha-500 border-t-transparent rounded-full shadow-[0_0_20px_#84e7a5]"
            />
            <div className="text-center">
              <p className="text-white font-black text-xs uppercase tracking-[0.4em] animate-pulse">Syncing User Identity</p>
              <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">Reconfiguring Neural Map Assets...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div >
  );
};

export default Dashboard;
