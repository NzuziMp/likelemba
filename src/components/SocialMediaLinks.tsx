import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

export const SocialMediaLinks = () => {
  const socialLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: 'https://facebook.com/likelemba',
      color: 'hover:text-blue-400',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: 'https://twitter.com/likelemba',
      color: 'hover:text-sky-400',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: 'https://instagram.com/likelemba',
      color: 'hover:text-pink-400',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: 'https://linkedin.com/company/likelemba',
      color: 'hover:text-blue-500',
    },
    {
      name: 'YouTube',
      icon: Youtube,
      url: 'https://youtube.com/@likelemba',
      color: 'hover:text-red-500',
    },
  ];

  return (
    <div className="flex items-center justify-center space-x-4">
      {socialLinks.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`text-slate-300 ${social.color} transition-colors`}
          aria-label={social.name}
        >
          <social.icon className="w-5 h-5" />
        </a>
      ))}
    </div>
  );
};
