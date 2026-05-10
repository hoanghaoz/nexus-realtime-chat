import type {
  ChatMessageData,
  FriendItemData,
  GroupItemData,
} from "@/types/nexus-chat";

export const MOCK_GROUPS: GroupItemData[] = [
  {
    id: "backend-dev",
    name: "Nhóm Backend Dev",
    membersText: "3 thành viên",
    timeText: "1h",
    active: true,
    avatars: [
      {
        id: "g1-a1",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCiELq-OLmEsUsQaj-5Gd9gewmKLNxtx6VNFK533s1il_svjcQMHggUqllT_iEdowO9ILsxT3QG1A8rvG7DZwiw7QfGGMMkeEf6oJTRrcgnTWUsRrmCuYv8Yw1k3a1i3ZUKG2Xa5ZgsB0X8lXjeQuxrFgR_VpOGZ7rkE4BnX-TVCdf_m_ySxbGJaHfz3SOwWVTN8n_3sCXlgClyPG1OUU_uJ8FovCBjbppHPilaf_iFXKXZ4F3nZ-D2eCXGMw7_wFstQ5xAshsjcEHl",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-10 shadow-sm",
      },
      {
        id: "g1-a2",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhdohSQixQb0_g2QHWuSjJA9BVRoSYDXNtAVblJFt41U_XFe3qsht6jW2kgRG2Nj_mGvdoMLNOMjeDqtkAJmuCMOgnHgZk3Z8EZFvjpNtEE_dzqj5fbaIIhatNNyIo27VhGofWsWIJtskkiYRPBEFwP1vyTGsrSnCgE2v1ssbEyCnhBayfj0NdRWL8aV_CQpNad5AXaKw7FnpPOBQFuor-1HOLiNU0lDip4uImly68rzLJNX-IvnOUzXetIwUTNSFpNOG0d1yYsmXM",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-20 shadow-sm bg-blue-100",
      },
      {
        id: "g1-a3",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWqMuwTLG1uqjgIAA-3wQB4vA6jE5kCg3CzsxC2EZCGJvzFhJvLTidTR-Gg40KSKpVLuJ_71qB7OzUkdBM-YwyT4Krw9rwNp9-mhubkrJp2H9ZKr1MV8huzh8YYuE3g5yBWsVM2ejI4oJk_ByAPe5oUvptpge62ygsreWO5RYTgub18CaFpfWHGLsxwO9yIroBtKcABYjaLOJW1F4dnl31DK4KRp5zEADMQSjqDuA0FpAyed5WQRJvNQbK6fiRywB2LE2N0r4ozmnQ",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-30 shadow-sm bg-purple-100",
      },
    ],
  },
  {
    id: "frontend-dev",
    name: "Nhóm Frontend Dev",
    membersText: "3 thành viên",
    timeText: "1h",
    avatars: [
      {
        id: "g2-a1",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHjnBaV2aPWhx3hYvKstK9YrlQRmG8u7uo71Dn7vpxnpF_jojhRQQl1pVTYhvPN3CNeAxuhFOFJKgnA4uan_Bb6Zo4NGqH9lAfihzfCKRczB1Ql5CRkv7tGrqzAujeZx6JffLEUtlL7dnbG4ktnVx4Kidxfm3uzhb01AeOgDTWIEhE2aDqT4Gx_Uqmsi-pFmRVxmTI7ScC3BP4X_1tqNlpyyTWybsdBrfj6QR_HdF97DTWxto2uOp3AosNcg81mPC-0K5VpAe4cQdM",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-10 shadow-sm",
      },
      {
        id: "g2-a2",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhdohSQixQb0_g2QHWuSjJA9BVRoSYDXNtAVblJFt41U_XFe3qsht6jW2kgRG2Nj_mGvdoMLNOMjeDqtkAJmuCMOgnHgZk3Z8EZFvjpNtEE_dzqj5fbaIIhatNNyIo27VhGofWsWIJtskkiYRPBEFwP1vyTGsrSnCgE2v1ssbEyCnhBayfj0NdRWL8aV_CQpNad5AXaKw7FnpPOBQFuor-1HOLiNU0lDip4uImly68rzLJNX-IvnOUzXetIwUTNSFpNOG0d1yYsmXM",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-20 shadow-sm bg-blue-100",
      },
      {
        id: "g2-a3",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCiELq-OLmEsUsQaj-5Gd9gewmKLNxtx6VNFK533s1il_svjcQMHggUqllT_iEdowO9ILsxT3QG1A8rvG7DZwiw7QfGGMMkeEf6oJTRrcgnTWUsRrmCuYv8Yw1k3a1i3ZUKG2Xa5ZgsB0X8lXjeQuxrFgR_VpOGZ7rkE4BnX-TVCdf_m_ySxbGJaHfz3SOwWVTN8n_3sCXlgClyPG1OUU_uJ8FovCBjbppHPilaf_iFXKXZ4F3nZ-D2eCXGMw7_wFstQ5xAshsjcEHl",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-30 shadow-sm",
      },
    ],
  },
  {
    id: "test",
    name: "Nhóm Test",
    membersText: "3 thành viên",
    timeText: "2h",
    avatars: [
      {
        id: "g3-a1",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDimkT4mamvn9uLhPg0ETTX9w46fg5KQVP7h-lh0Tlub5_xZ1_d5VdfC-faDuDgLNB5AQFPxjHRxuH6_8iWOTdktUGoAI_iqHfhT5oBKzOiDZ9JOPJJgR_ss-pmi8aAZuFGlGBpH7twvML_Z-aVjTC_4jzFE3N1VcrLEwppPClr0cCL0t5JM__Y72u6rrTaxCIrHPVpSxTQarZWjvQSHwc8PsotgDY0Due0Fl_cWzhhEd9eDA9sRAbKXOY_UimFCT6fuC-wjvi8BsY7",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-10 shadow-sm",
      },
      {
        id: "g3-a2",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDtBfHqXFbWzuIYPltvIieRr7ZnexR743WXVB1fS5jNLLuDmto2X0JsWzTuIekOqF_27rH3RDuzTviYPnXrnn_DGd9kBlkhqEr3nYKefo5AUNSa9Hir9BKs8NYlyGTLl6CuHveB3Wae7QZVoGfZeE3idR46_Xh0mbbLfYd9nDkBV0LCiDpvOEzYdJ7k9SGvGXuSVA2JDYs8Lc-dwaG7J5XqLMSpiRj4gtgBuE9m_PDDjsmIijydMtEzqPA7jPxbdY7GrztCviFNtOnJ",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-20 shadow-sm",
      },
      {
        id: "g3-a3",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWqMuwTLG1uqjgIAA-3wQB4vA6jE5kCg3CzsxC2EZCGJvzFhJvLTidTR-Gg40KSKpVLuJ_71qB7OzUkdBM-YwyT4Krw9rwNp9-mhubkrJp2H9ZKr1MV8huzh8YYuE3g5yBWsVM2ejI4oJk_ByAPe5oUvptpge62ygsreWO5RYTgub18CaFpfWHGLsxwO9yIroBtKcABYjaLOJW1F4dnl31DK4KRp5zEADMQSjqDuA0FpAyed5WQRJvNQbK6fiRywB2LE2N0r4ozmnQ",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-30 shadow-sm",
      },
    ],
  },
  {
    id: "group2",
    name: "group2",
    membersText: "3 thành viên",
    timeText: "17h",
    avatars: [
      {
        id: "g4-a1",
        type: "text",
        text: "A",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white bg-blue-500 text-white flex items-center justify-center font-bold relative z-10 shadow-sm",
      },
      {
        id: "g4-a2",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBhdohSQixQb0_g2QHWuSjJA9BVRoSYDXNtAVblJFt41U_XFe3qsht6jW2kgRG2Nj_mGvdoMLNOMjeDqtkAJmuCMOgnHgZk3Z8EZFvjpNtEE_dzqj5fbaIIhatNNyIo27VhGofWsWIJtskkiYRPBEFwP1vyTGsrSnCgE2v1ssbEyCnhBayfj0NdRWL8aV_CQpNad5AXaKw7FnpPOBQFuor-1HOLiNU0lDip4uImly68rzLJNX-IvnOUzXetIwUTNSFpNOG0d1yYsmXM",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-20 shadow-sm",
      },
      {
        id: "g4-a3",
        type: "image",
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCiELq-OLmEsUsQaj-5Gd9gewmKLNxtx6VNFK533s1il_svjcQMHggUqllT_iEdowO9ILsxT3QG1A8rvG7DZwiw7QfGGMMkeEf6oJTRrcgnTWUsRrmCuYv8Yw1k3a1i3ZUKG2Xa5ZgsB0X8lXjeQuxrFgR_VpOGZ7rkE4BnX-TVCdf_m_ySxbGJaHfz3SOwWVTN8n_3sCXlgClyPG1OUU_uJ8FovCBjbppHPilaf_iFXKXZ4F3nZ-D2eCXGMw7_wFstQ5xAshsjcEHl",
        className:
          "w-[42px] h-[42px] rounded-full border-2 border-white object-cover relative z-30 shadow-sm",
      },
    ],
  },
];

export const MOCK_FRIENDS: FriendItemData[] = [
  {
    id: "friend-1",
    name: "M tikcode",
    subtitle: "bla bla bla",
    subtitleClassName: "text-[13px] text-[#7a28cb] mt-0.5 font-medium",
    timeText: "1d",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBWqMuwTLG1uqjgIAA-3wQB4vA6jE5kCg3CzsxC2EZCGJvzFhJvLTidTR-Gg40KSKpVLuJ_71qB7OzUkdBM-YwyT4Krw9rwNp9-mhubkrJp2H9ZKr1MV8huzh8YYuE3g5yBWsVM2ejI4oJk_ByAPe5oUvptpge62ygsreWO5RYTgub18CaFpfWHGLsxwO9yIroBtKcABYjaLOJW1F4dnl31DK4KRp5zEADMQSjqDuA0FpAyed5WQRJvNQbK6fiRywB2LE2N0r4ozmnQ",
    avatarClassName:
      "w-[46px] h-[46px] rounded-full object-cover shadow-sm bg-yellow-100 p-0.5",
    statusDotClassName:
      "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-white bg-slate-300",
  },
  {
    id: "friend-2",
    name: "Mai Lê",
    subtitle: "...",
    subtitleClassName: "text-[13px] text-slate-500 mt-0.5 font-medium",
    timeText: "4d",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtBfHqXFbWzuIYPltvIieRr7ZnexR743WXVB1fS5jNLLuDmto2X0JsWzTuIekOqF_27rH3RDuzTviYPnXrnn_DGd9kBlkhqEr3nYKefo5AUNSa9Hir9BKs8NYlyGTLl6CuHveB3Wae7QZVoGfZeE3idR46_Xh0mbbLfYd9nDkBV0LCiDpvOEzYdJ7k9SGvGXuSVA2JDYs8Lc-dwaG7J5XqLMSpiRj4gtgBuE9m_PDDjsmIijydMtEzqPA7jPxbdY7GrztCviFNtOnJ",
    avatarClassName:
      "w-[46px] h-[46px] rounded-full object-cover shadow-sm bg-purple-100 p-0.5",
    statusDotClassName:
      "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-white bg-slate-300",
  },
  {
    id: "friend-3",
    name: "User Một",
    subtitle: "user1",
    subtitleClassName: "text-[13px] text-slate-500 mt-0.5 font-medium",
    timeText: "Online",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCiELq-OLmEsUsQaj-5Gd9gewmKLNxtx6VNFK533s1il_svjcQMHggUqllT_iEdowO9ILsxT3QG1A8rvG7DZwiw7QfGGMMkeEf6oJTRrcgnTWUsRrmCuYv8Yw1k3a1i3ZUKG2Xa5ZgsB0X8lXjeQuxrFgR_VpOGZ7rkE4BnX-TVCdf_m_ySxbGJaHfz3SOwWVTN8n_3sCXlgClyPG1OUU_uJ8FovCBjbppHPilaf_iFXKXZ4F3nZ-D2eCXGMw7_wFstQ5xAshsjcEHl",
    avatarClassName:
      "w-[46px] h-[46px] rounded-full object-cover shadow-sm bg-blue-100 p-0.5",
    statusDotClassName:
      "absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-[2.5px] border-white bg-green-500",
  },
];

export const MOCK_MESSAGES: ChatMessageData[] = [
  {
    id: "msg-1",
    type: "other",
    sender: "Elena Rostova",
    timeText: "10:42 AM",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCHjnBaV2aPWhx3hYvKstK9YrlQRmG8u7uo71Dn7vpxnpF_jojhRQQl1pVTYhvPN3CNeAxuhFOFJKgnA4uan_Bb6Zo4NGqH9lAfihzfCKRczB1Ql5CRkv7tGrqzAujeZx6JffLEUtlL7dnbG4ktnVx4Kidxfm3uzhb01AeOgDTWIEhE2aDqT4Gx_Uqmsi-pFmRVxmTI7ScC3BP4X_1tqNlpyyTWybsdBrfj6QR_HdF97DTWxto2uOp3AosNcg81mPC-0K5VpAe4cQdM",
    text: "Hey! Have you had a chance to look over the new API documentation for the authentication module?",
  },
  {
    id: "msg-2",
    type: "me",
    timeText: "10:45 AM",
    text: "Yes, I reviewed it this morning. The endpoints look clean, but we might need to adjust the token refresh lifecycle. I'll drop some comments in the repo.",
  },
  {
    id: "msg-3",
    type: "other",
    sender: "Elena Rostova",
    timeText: "10:48 AM",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDimkT4mamvn9uLhPg0ETTX9w46fg5KQVP7h-lh0Tlub5_xZ1_d5VdfC-faDuDgLNB5AQFPxjHRxuH6_8iWOTdktUGoAI_iqHfhT5oBKzOiDZ9JOPJJgR_ss-pmi8aAZuFGlGBpH7twvML_Z-aVjTC_4jzFE3N1VcrLEwppPClr0cCL0t5JM__Y72u6rrTaxCIrHPVpSxTQarZWjvQSHwc8PsotgDY0Due0Fl_cWzhhEd9eDA9sRAbKXOY_UimFCT6fuC-wjvi8BsY7",
    text: "Sounds good. Let's sync up after you add those comments. Are you free around 2 PM?",
  },
  {
    id: "msg-4",
    type: "typing",
    avatarSrc:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDtBfHqXFbWzuIYPltvIieRr7ZnexR743WXVB1fS5jNLLuDmto2X0JsWzTuIekOqF_27rH3RDuzTviYPnXrnn_DGd9kBlkhqEr3nYKefo5AUNSa9Hir9BKs8NYlyGTLl6CuHveB3Wae7QZVoGfZeE3idR46_Xh0mbbLfYd9nDkBV0LCiDpvOEzYdJ7k9SGvGXuSVA2JDYs8Lc-dwaG7J5XqLMSpiRj4gtgBuE9m_PDDjsmIijydMtEzqPA7jPxbdY7GrztCviFNtOnJ",
  },
];
