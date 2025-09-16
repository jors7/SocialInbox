-- Insert default flow templates
insert into public.flow_templates (name, category, description, spec, is_public) values
(
  'Welcome Message',
  'basic',
  'Simple welcome message with quick replies',
  '{
    "version": "1",
    "entry": "start",
    "nodes": {
      "start": {
        "type": "message",
        "text": "Welcome! How can I help you today?",
        "go": "menu"
      },
      "menu": {
        "type": "quick_reply",
        "text": "Please choose an option:",
        "quickReplies": [
          {"text": "Get Info", "go": "info"},
          {"text": "Contact Support", "go": "support"},
          {"text": "Exit", "go": "end"}
        ]
      },
      "info": {
        "type": "message",
        "text": "Here is the information you requested. Visit our website for more details.",
        "go": "end"
      },
      "support": {
        "type": "message",
        "text": "I''ll connect you with our support team right away.",
        "go": "end"
      },
      "end": {
        "type": "end"
      }
    }
  }'::jsonb,
  true
),
(
  'Lead Capture',
  'marketing',
  'Capture email and deliver lead magnet',
  '{
    "version": "1",
    "entry": "start",
    "nodes": {
      "start": {
        "type": "message",
        "text": "Want to get our free guide?",
        "go": "confirm"
      },
      "confirm": {
        "type": "quick_reply",
        "text": "Click Yes to receive it instantly!",
        "quickReplies": [
          {"text": "Yes, send it!", "go": "capture"},
          {"text": "No thanks", "go": "end"}
        ]
      },
      "capture": {
        "type": "action",
        "action": "capture_email",
        "go": "deliver"
      },
      "deliver": {
        "type": "message",
        "text": "Great! Check your email for the guide. Here''s a direct link: {{download_url}}",
        "go": "end"
      },
      "end": {
        "type": "end"
      }
    }
  }'::jsonb,
  true
),
(
  'Product Inquiry',
  'ecommerce',
  'Handle product questions and guide to purchase',
  '{
    "version": "1",
    "entry": "start",
    "nodes": {
      "start": {
        "type": "message",
        "text": "Thanks for your interest! What would you like to know?",
        "go": "menu"
      },
      "menu": {
        "type": "quick_reply",
        "text": "Select an option:",
        "quickReplies": [
          {"text": "Pricing", "go": "pricing"},
          {"text": "Features", "go": "features"},
          {"text": "Order Now", "go": "order"},
          {"text": "Talk to Sales", "go": "sales"}
        ]
      },
      "pricing": {
        "type": "message",
        "text": "Our pricing starts at $29/month. Use code INSTAGRAM for 20% off your first month!",
        "go": "offer"
      },
      "features": {
        "type": "message",
        "text": "Key features include:\n• Feature 1\n• Feature 2\n• Feature 3\n\nWant to see a demo?",
        "go": "offer"
      },
      "order": {
        "type": "message",
        "text": "Great! Click here to order: {{order_link}}\n\nUse code INSTAGRAM for 20% off!",
        "go": "end"
      },
      "sales": {
        "type": "action",
        "action": "notify_team",
        "params": {"message": "New sales inquiry from Instagram", "channel": "sales"},
        "go": "sales_confirm"
      },
      "sales_confirm": {
        "type": "message",
        "text": "I''ve notified our sales team. They''ll reach out within 1 business day.",
        "go": "end"
      },
      "offer": {
        "type": "quick_reply",
        "text": "Ready to get started?",
        "quickReplies": [
          {"text": "Yes, order now!", "go": "order"},
          {"text": "I have questions", "go": "sales"},
          {"text": "Maybe later", "go": "end"}
        ]
      },
      "end": {
        "type": "end"
      }
    }
  }'::jsonb,
  true
),
(
  'Contest Entry',
  'marketing',
  'Collect entries for a giveaway or contest',
  '{
    "version": "1",
    "entry": "start",
    "nodes": {
      "start": {
        "type": "message",
        "text": "Welcome to our giveaway! 🎉",
        "go": "rules"
      },
      "rules": {
        "type": "message",
        "text": "To enter:\n1. Follow our account\n2. Share your email\n3. Tag 2 friends in the comments\n\nReady to enter?",
        "go": "confirm"
      },
      "confirm": {
        "type": "quick_reply",
        "text": "Do you want to enter the giveaway?",
        "quickReplies": [
          {"text": "Yes, enter me!", "go": "check_follow"},
          {"text": "Tell me more", "go": "more_info"},
          {"text": "No thanks", "go": "end"}
        ]
      },
      "more_info": {
        "type": "message",
        "text": "Prize: {{prize_description}}\nWinner announced: {{contest_end_date}}\n\nGood luck!",
        "go": "confirm"
      },
      "check_follow": {
        "type": "condition",
        "condition": "is_follower equals true",
        "true": "capture_email",
        "false": "ask_follow"
      },
      "ask_follow": {
        "type": "message",
        "text": "Please follow our account first, then come back to complete your entry!",
        "go": "end"
      },
      "capture_email": {
        "type": "action",
        "action": "capture_email",
        "go": "tag_friends"
      },
      "tag_friends": {
        "type": "message",
        "text": "Almost done! Now go back to the post and tag 2 friends in the comments.",
        "go": "confirm_entry"
      },
      "confirm_entry": {
        "type": "action",
        "action": "add_tag",
        "params": {"tag": "contest_entered"},
        "go": "success"
      },
      "success": {
        "type": "message",
        "text": "You''re entered! 🎊 We''ll DM you if you win. Good luck!",
        "go": "end"
      },
      "end": {
        "type": "end"
      }
    }
  }'::jsonb,
  true
),
(
  'Customer Support',
  'support',
  'Basic customer support flow with escalation',
  '{
    "version": "1",
    "entry": "start",
    "nodes": {
      "start": {
        "type": "message",
        "text": "Hi! I''m here to help. What can I assist you with?",
        "go": "menu"
      },
      "menu": {
        "type": "quick_reply",
        "text": "Please select a topic:",
        "quickReplies": [
          {"text": "Order Status", "go": "order_status"},
          {"text": "Returns", "go": "returns"},
          {"text": "Technical Issue", "go": "technical"},
          {"text": "Other", "go": "other"}
        ]
      },
      "order_status": {
        "type": "message",
        "text": "To check your order status, please visit: {{order_tracking_link}}\n\nYou''ll need your order number.",
        "go": "resolved_check"
      },
      "returns": {
        "type": "message",
        "text": "Our return policy:\n• 30-day return window\n• Items must be unused\n• Free return shipping\n\nTo start a return: {{returns_link}}",
        "go": "resolved_check"
      },
      "technical": {
        "type": "message",
        "text": "For technical issues, please describe your problem and we''ll help you troubleshoot.",
        "go": "capture_issue"
      },
      "other": {
        "type": "message",
        "text": "Please describe how we can help you.",
        "go": "capture_issue"
      },
      "capture_issue": {
        "type": "action",
        "action": "capture_text",
        "params": {"variable": "issue_description"},
        "go": "escalate"
      },
      "escalate": {
        "type": "action",
        "action": "notify_team",
        "params": {"message": "New support request: {{issue_description}}", "channel": "support"},
        "go": "escalate_confirm"
      },
      "escalate_confirm": {
        "type": "message",
        "text": "I''ve forwarded your request to our support team. They''ll respond within 2-4 hours during business hours.",
        "go": "end"
      },
      "resolved_check": {
        "type": "quick_reply",
        "text": "Did this help resolve your issue?",
        "quickReplies": [
          {"text": "Yes, thanks!", "go": "resolved"},
          {"text": "No, I need help", "go": "other"}
        ]
      },
      "resolved": {
        "type": "message",
        "text": "Great! Have a wonderful day! 😊",
        "go": "end"
      },
      "end": {
        "type": "end"
      }
    }
  }'::jsonb,
  true
);