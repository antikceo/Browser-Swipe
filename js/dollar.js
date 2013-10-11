/**
 * The $1 Unistroke Recognizer (JavaScript version)
 *
 *	Jacob O. Wobbrock, Ph.D.
 * 	The Information School
 *	University of Washington
 *	Seattle, WA 98195-2840
 *	wobbrock@uw.edu
 *
 *	Andrew D. Wilson, Ph.D.
 *	Microsoft Research
 *	One Microsoft Way
 *	Redmond, WA 98052
 *	awilson@microsoft.com
 *
 *	Yang Li, Ph.D.
 *	Department of Computer Science and Engineering
 * 	University of Washington
 *	Seattle, WA 98195-2840
 * 	yangli@cs.washington.edu
 *
 * The academic publication for the $1 recognizer, and what should be 
 * used to cite it, is:
 *
 *	Wobbrock, J.O., Wilson, A.D. and Li, Y. (2007). Gestures without 
 *	  libraries, toolkits or training: A $1 recognizer for user interface 
 *	  prototypes. Proceedings of the ACM Symposium on User Interface 
 *	  Software and Technology (UIST '07). Newport, Rhode Island (October 
 *	  7-10, 2007). New York: ACM Press, pp. 159-168.
 *
 * The Protractor enhancement was separately published by Yang Li and programmed 
 * here by Jacob O. Wobbrock:
 *
 *	Li, Y. (2010). Protractor: A fast and accurate gesture
 *	  recognizer. Proceedings of the ACM Conference on Human
 *	  Factors in Computing Systems (CHI '10). Atlanta, Georgia
 *	  (April 10-15, 2010). New York: ACM Press, pp. 2169-2172.
 *
 * This software is distributed under the "New BSD License" agreement:
 *
 * Copyright (C) 2007-2012, Jacob O. Wobbrock, Andrew D. Wilson and Yang Li.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the names of the University of Washington nor Microsoft,
 *      nor the names of its contributors may be used to endorse or promote
 *      products derived from this software without specific prior written
 *      permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL Jacob O. Wobbrock OR Andrew D. Wilson
 * OR Yang Li BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
 * OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/
//
// Point class
//
function Point(x, y) // constructor
{
	this.X = x;
	this.Y = y;
}
//
// Rectangle class
//
function Rectangle(x, y, width, height) // constructor
{
	this.X = x;
	this.Y = y;
	this.Width = width;
	this.Height = height;
}
//
// Unistroke class: a unistroke template
//
function Unistroke(name, points) // constructor
{
	this.Name = name;
	this.Points = Resample(points, NumPoints);
	var radians = IndicativeAngle(this.Points);
	this.Points = RotateBy(this.Points, -radians);
	this.Points = ScaleTo(this.Points, SquareSize);
	this.Points = TranslateTo(this.Points, Origin);
	this.Vector = Vectorize(this.Points); // for Protractor
}
//
// Result class
//
function Result(name, score) // constructor
{
	this.Name = name;
	this.Score = score;
}
//
// DollarRecognizer class constants
//
var NumUnistrokes = 16;
var NumPoints = 64;
var SquareSize = 250.0;
var Origin = new Point(0,0);
var Diagonal = Math.sqrt(SquareSize * SquareSize + SquareSize * SquareSize);
var HalfDiagonal = 0.5 * Diagonal;
var AngleRange = Deg2Rad(45.0);
var AnglePrecision = Deg2Rad(2.0);
var Phi = 0.5 * (-1.0 + Math.sqrt(5.0)); // Golden Ratio
//
// DollarRecognizer class
//
function DollarRecognizer() // constructor
{
	//
	// one built-in unistroke per gesture type
	//
	this.Unistrokes = new Array(7);
	//this.Unistrokes = new Array(NumUnistrokes);
	this.Unistrokes[0] = new Unistroke("none", new Array(new Point(297,329) , new Point(323,300) , new Point(429,204) , new Point(480,174) , new Point(536,148) , new Point(553,145)));
	this.Unistrokes[1] = new Unistroke("none", new Array(new Point(355,347),new Point(424,293),new Point(531,215),new Point(622,162),new Point(691,128),new Point(712,121),new Point(729,115),new Point(740,112)));
	this.Unistrokes[2] = new Unistroke("none", new Array(new Point(225,359),new Point(230,353),new Point(252,329),new Point(441,136),new Point(480,107),new Point(502,94)));
	this.Unistrokes[3] = new Unistroke("diag-front", new Array(new Point(322,357),new Point(382,316),new Point(465,253),new Point(549,189),new Point(577,166),new Point(606,143),new Point(613,137)));
	this.Unistrokes[4] = new Unistroke("horiz-front", new Array(new Point(110,155),new Point(127,155),new Point(284,140),new Point(401,129),new Point(479,123),new Point(564,122),new Point(585,122)));
	this.Unistrokes[5] = new Unistroke("diag-back", new Array(new Point(681,285),new Point(677,284),new Point(630,257),new Point(523,190),new Point(440,136),new Point(398,105),new Point(386,97)));
	this.Unistrokes[6] = new Unistroke("horiz-back", new Array(new Point(650,188) , new Point(646,188) , new Point(628,188) , new Point(593,188) , new Point(433,200) , new Point(313,210) , new Point(239,212) , new Point(228,212)  ));
	this.Unistrokes[7] = new Unistroke("horiz-back", new Array(new Point(743,211) , new Point(738,211) , new Point(671,211) , new Point(554,209) , new Point(459,205) , new Point(323,202) , new Point(307,200) , new Point(294,199) , new Point(285,197) , new Point(276,197) , new Point(257,196) , new Point(248,196) , new Point(243,196) , new Point(239,196) , new Point(238,196) , new Point(237,196) , new Point(233,196) , new Point(230,197) , new Point(225,197) , new Point(219,197) , new Point(215,197) , new Point(206,197) , new Point(202,197) , new Point(198,197) , new Point(192,197) , new Point(189,196) , new Point(181,194) , new Point(178,194) , new Point(175,194) , new Point(173,194) , new Point(171,194) , new Point(169,194) , new Point(168,194) , new Point(165,194) , new Point(164,194) , new Point(163,194) , new Point(162,194) , new Point(162,194) , new Point(161,194) , new Point(160,194) , new Point(159,194) , new Point(158,194) , new Point(154,194) , new Point(153,194) , new Point(152,194) , new Point(151,194) , new Point(150,194) , new Point(149,195) , new Point(148,195) , new Point(147,195) , new Point(146,196) , new Point(144,196) , new Point(142,196) , new Point(141,196)));
	this.Unistrokes[8] = new Unistroke("zig-blur", new Array(new Point(171,155) , new Point(182,155) , new Point(265,155) , new Point(354,156) , new Point(414,160) , new Point(441,162) , new Point(443,163) , new Point(440,163) , new Point(406,165) , new Point(352,179) , new Point(273,203) , new Point(218,221) , new Point(177,237) , new Point(132,256) , new Point(117,262) , new Point(117,265) , new Point(163,280) , new Point(254,289) , new Point(332,282) , new Point(372,272) , new Point(387,268) , new Point(389,268) , new Point(388,268) , new Point(384,269) , new Point(379,270) ));
/*	this.Unistrokes[9] = new Unistroke("front", new Array());
	this.Unistrokes[10] = new Unistroke("front", new Array());
	this.Unistrokes[11] = new Unistroke("front", new Array());
	this.Unistrokes[12] = new Unistroke("front", new Array());
	this.Unistrokes[13] = new Unistroke("front", new Array());
	this.Unistrokes[14] = new Unistroke("front", new Array());
	this.Unistrokes[15] = new Unistroke("front", new Array());
	*/
	/*
	this.Unistrokes[2] = new Unistroke("rectangle", new Array(new Point(78,149),new Point(78,153),new Point(78,157),new Point(78,160),new Point(79,162),new Point(79,164),new Point(79,167),new Point(79,169),new Point(79,173),new Point(79,178),new Point(79,183),new Point(80,189),new Point(80,193),new Point(80,198),new Point(80,202),new Point(81,208),new Point(81,210),new Point(81,216),new Point(82,222),new Point(82,224),new Point(82,227),new Point(83,229),new Point(83,231),new Point(85,230),new Point(88,232),new Point(90,233),new Point(92,232),new Point(94,233),new Point(99,232),new Point(102,233),new Point(106,233),new Point(109,234),new Point(117,235),new Point(123,236),new Point(126,236),new Point(135,237),new Point(142,238),new Point(145,238),new Point(152,238),new Point(154,239),new Point(165,238),new Point(174,237),new Point(179,236),new Point(186,235),new Point(191,235),new Point(195,233),new Point(197,233),new Point(200,233),new Point(201,235),new Point(201,233),new Point(199,231),new Point(198,226),new Point(198,220),new Point(196,207),new Point(195,195),new Point(195,181),new Point(195,173),new Point(195,163),new Point(194,155),new Point(192,145),new Point(192,143),new Point(192,138),new Point(191,135),new Point(191,133),new Point(191,130),new Point(190,128),new Point(188,129),new Point(186,129),new Point(181,132),new Point(173,131),new Point(162,131),new Point(151,132),new Point(149,132),new Point(138,132),new Point(136,132),new Point(122,131),new Point(120,131),new Point(109,130),new Point(107,130),new Point(90,132),new Point(81,133),new Point(76,133)));
	this.Unistrokes[3] = new Unistroke("circle", new Array(new Point(127,141),new Point(124,140),new Point(120,139),new Point(118,139),new Point(116,139),new Point(111,140),new Point(109,141),new Point(104,144),new Point(100,147),new Point(96,152),new Point(93,157),new Point(90,163),new Point(87,169),new Point(85,175),new Point(83,181),new Point(82,190),new Point(82,195),new Point(83,200),new Point(84,205),new Point(88,213),new Point(91,216),new Point(96,219),new Point(103,222),new Point(108,224),new Point(111,224),new Point(120,224),new Point(133,223),new Point(142,222),new Point(152,218),new Point(160,214),new Point(167,210),new Point(173,204),new Point(178,198),new Point(179,196),new Point(182,188),new Point(182,177),new Point(178,167),new Point(170,150),new Point(163,138),new Point(152,130),new Point(143,129),new Point(140,131),new Point(129,136),new Point(126,139)));
	this.Unistrokes[4] = new Unistroke("check", new Array(new Point(91,185),new Point(93,185),new Point(95,185),new Point(97,185),new Point(100,188),new Point(102,189),new Point(104,190),new Point(106,193),new Point(108,195),new Point(110,198),new Point(112,201),new Point(114,204),new Point(115,207),new Point(117,210),new Point(118,212),new Point(120,214),new Point(121,217),new Point(122,219),new Point(123,222),new Point(124,224),new Point(126,226),new Point(127,229),new Point(129,231),new Point(130,233),new Point(129,231),new Point(129,228),new Point(129,226),new Point(129,224),new Point(129,221),new Point(129,218),new Point(129,212),new Point(129,208),new Point(130,198),new Point(132,189),new Point(134,182),new Point(137,173),new Point(143,164),new Point(147,157),new Point(151,151),new Point(155,144),new Point(161,137),new Point(165,131),new Point(171,122),new Point(174,118),new Point(176,114),new Point(177,112),new Point(177,114),new Point(175,116),new Point(173,118)));
	this.Unistrokes[5] = new Unistroke("caret", new Array(new Point(79,245),new Point(79,242),new Point(79,239),new Point(80,237),new Point(80,234),new Point(81,232),new Point(82,230),new Point(84,224),new Point(86,220),new Point(86,218),new Point(87,216),new Point(88,213),new Point(90,207),new Point(91,202),new Point(92,200),new Point(93,194),new Point(94,192),new Point(96,189),new Point(97,186),new Point(100,179),new Point(102,173),new Point(105,165),new Point(107,160),new Point(109,158),new Point(112,151),new Point(115,144),new Point(117,139),new Point(119,136),new Point(119,134),new Point(120,132),new Point(121,129),new Point(122,127),new Point(124,125),new Point(126,124),new Point(129,125),new Point(131,127),new Point(132,130),new Point(136,139),new Point(141,154),new Point(145,166),new Point(151,182),new Point(156,193),new Point(157,196),new Point(161,209),new Point(162,211),new Point(167,223),new Point(169,229),new Point(170,231),new Point(173,237),new Point(176,242),new Point(177,244),new Point(179,250),new Point(181,255),new Point(182,257)));
	this.Unistrokes[6] = new Unistroke("zig-zag", new Array(new Point(307,216),new Point(333,186),new Point(356,215),new Point(375,186),new Point(399,216),new Point(418,186)));
	this.Unistrokes[7] = new Unistroke("arrow", new Array(new Point(68,222),new Point(70,220),new Point(73,218),new Point(75,217),new Point(77,215),new Point(80,213),new Point(82,212),new Point(84,210),new Point(87,209),new Point(89,208),new Point(92,206),new Point(95,204),new Point(101,201),new Point(106,198),new Point(112,194),new Point(118,191),new Point(124,187),new Point(127,186),new Point(132,183),new Point(138,181),new Point(141,180),new Point(146,178),new Point(154,173),new Point(159,171),new Point(161,170),new Point(166,167),new Point(168,167),new Point(171,166),new Point(174,164),new Point(177,162),new Point(180,160),new Point(182,158),new Point(183,156),new Point(181,154),new Point(178,153),new Point(171,153),new Point(164,153),new Point(160,153),new Point(150,154),new Point(147,155),new Point(141,157),new Point(137,158),new Point(135,158),new Point(137,158),new Point(140,157),new Point(143,156),new Point(151,154),new Point(160,152),new Point(170,149),new Point(179,147),new Point(185,145),new Point(192,144),new Point(196,144),new Point(198,144),new Point(200,144),new Point(201,147),new Point(199,149),new Point(194,157),new Point(191,160),new Point(186,167),new Point(180,176),new Point(177,179),new Point(171,187),new Point(169,189),new Point(165,194),new Point(164,196)));
	this.Unistrokes[8] = new Unistroke("left square bracket", new Array(new Point(140,124),new Point(138,123),new Point(135,122),new Point(133,123),new Point(130,123),new Point(128,124),new Point(125,125),new Point(122,124),new Point(120,124),new Point(118,124),new Point(116,125),new Point(113,125),new Point(111,125),new Point(108,124),new Point(106,125),new Point(104,125),new Point(102,124),new Point(100,123),new Point(98,123),new Point(95,124),new Point(93,123),new Point(90,124),new Point(88,124),new Point(85,125),new Point(83,126),new Point(81,127),new Point(81,129),new Point(82,131),new Point(82,134),new Point(83,138),new Point(84,141),new Point(84,144),new Point(85,148),new Point(85,151),new Point(86,156),new Point(86,160),new Point(86,164),new Point(86,168),new Point(87,171),new Point(87,175),new Point(87,179),new Point(87,182),new Point(87,186),new Point(88,188),new Point(88,195),new Point(88,198),new Point(88,201),new Point(88,207),new Point(89,211),new Point(89,213),new Point(89,217),new Point(89,222),new Point(88,225),new Point(88,229),new Point(88,231),new Point(88,233),new Point(88,235),new Point(89,237),new Point(89,240),new Point(89,242),new Point(91,241),new Point(94,241),new Point(96,240),new Point(98,239),new Point(105,240),new Point(109,240),new Point(113,239),new Point(116,240),new Point(121,239),new Point(130,240),new Point(136,237),new Point(139,237),new Point(144,238),new Point(151,237),new Point(157,236),new Point(159,237)));
	this.Unistrokes[9] = new Unistroke("right square bracket", new Array(new Point(112,138),new Point(112,136),new Point(115,136),new Point(118,137),new Point(120,136),new Point(123,136),new Point(125,136),new Point(128,136),new Point(131,136),new Point(134,135),new Point(137,135),new Point(140,134),new Point(143,133),new Point(145,132),new Point(147,132),new Point(149,132),new Point(152,132),new Point(153,134),new Point(154,137),new Point(155,141),new Point(156,144),new Point(157,152),new Point(158,161),new Point(160,170),new Point(162,182),new Point(164,192),new Point(166,200),new Point(167,209),new Point(168,214),new Point(168,216),new Point(169,221),new Point(169,223),new Point(169,228),new Point(169,231),new Point(166,233),new Point(164,234),new Point(161,235),new Point(155,236),new Point(147,235),new Point(140,233),new Point(131,233),new Point(124,233),new Point(117,235),new Point(114,238),new Point(112,238)));
	this.Unistrokes[10] = new Unistroke("v", new Array(new Point(89,164),new Point(90,162),new Point(92,162),new Point(94,164),new Point(95,166),new Point(96,169),new Point(97,171),new Point(99,175),new Point(101,178),new Point(103,182),new Point(106,189),new Point(108,194),new Point(111,199),new Point(114,204),new Point(117,209),new Point(119,214),new Point(122,218),new Point(124,222),new Point(126,225),new Point(128,228),new Point(130,229),new Point(133,233),new Point(134,236),new Point(136,239),new Point(138,240),new Point(139,242),new Point(140,244),new Point(142,242),new Point(142,240),new Point(142,237),new Point(143,235),new Point(143,233),new Point(145,229),new Point(146,226),new Point(148,217),new Point(149,208),new Point(149,205),new Point(151,196),new Point(151,193),new Point(153,182),new Point(155,172),new Point(157,165),new Point(159,160),new Point(162,155),new Point(164,150),new Point(165,148),new Point(166,146)));
	this.Unistrokes[11] = new Unistroke("delete", new Array(new Point(123,129),new Point(123,131),new Point(124,133),new Point(125,136),new Point(127,140),new Point(129,142),new Point(133,148),new Point(137,154),new Point(143,158),new Point(145,161),new Point(148,164),new Point(153,170),new Point(158,176),new Point(160,178),new Point(164,183),new Point(168,188),new Point(171,191),new Point(175,196),new Point(178,200),new Point(180,202),new Point(181,205),new Point(184,208),new Point(186,210),new Point(187,213),new Point(188,215),new Point(186,212),new Point(183,211),new Point(177,208),new Point(169,206),new Point(162,205),new Point(154,207),new Point(145,209),new Point(137,210),new Point(129,214),new Point(122,217),new Point(118,218),new Point(111,221),new Point(109,222),new Point(110,219),new Point(112,217),new Point(118,209),new Point(120,207),new Point(128,196),new Point(135,187),new Point(138,183),new Point(148,167),new Point(157,153),new Point(163,145),new Point(165,142),new Point(172,133),new Point(177,127),new Point(179,127),new Point(180,125)));
	this.Unistrokes[12] = new Unistroke("left curly brace", new Array(new Point(150,116),new Point(147,117),new Point(145,116),new Point(142,116),new Point(139,117),new Point(136,117),new Point(133,118),new Point(129,121),new Point(126,122),new Point(123,123),new Point(120,125),new Point(118,127),new Point(115,128),new Point(113,129),new Point(112,131),new Point(113,134),new Point(115,134),new Point(117,135),new Point(120,135),new Point(123,137),new Point(126,138),new Point(129,140),new Point(135,143),new Point(137,144),new Point(139,147),new Point(141,149),new Point(140,152),new Point(139,155),new Point(134,159),new Point(131,161),new Point(124,166),new Point(121,166),new Point(117,166),new Point(114,167),new Point(112,166),new Point(114,164),new Point(116,163),new Point(118,163),new Point(120,162),new Point(122,163),new Point(125,164),new Point(127,165),new Point(129,166),new Point(130,168),new Point(129,171),new Point(127,175),new Point(125,179),new Point(123,184),new Point(121,190),new Point(120,194),new Point(119,199),new Point(120,202),new Point(123,207),new Point(127,211),new Point(133,215),new Point(142,219),new Point(148,220),new Point(151,221)));
	this.Unistrokes[13] = new Unistroke("right curly brace", new Array(new Point(117,132),new Point(115,132),new Point(115,129),new Point(117,129),new Point(119,128),new Point(122,127),new Point(125,127),new Point(127,127),new Point(130,127),new Point(133,129),new Point(136,129),new Point(138,130),new Point(140,131),new Point(143,134),new Point(144,136),new Point(145,139),new Point(145,142),new Point(145,145),new Point(145,147),new Point(145,149),new Point(144,152),new Point(142,157),new Point(141,160),new Point(139,163),new Point(137,166),new Point(135,167),new Point(133,169),new Point(131,172),new Point(128,173),new Point(126,176),new Point(125,178),new Point(125,180),new Point(125,182),new Point(126,184),new Point(128,187),new Point(130,187),new Point(132,188),new Point(135,189),new Point(140,189),new Point(145,189),new Point(150,187),new Point(155,186),new Point(157,185),new Point(159,184),new Point(156,185),new Point(154,185),new Point(149,185),new Point(145,187),new Point(141,188),new Point(136,191),new Point(134,191),new Point(131,192),new Point(129,193),new Point(129,195),new Point(129,197),new Point(131,200),new Point(133,202),new Point(136,206),new Point(139,211),new Point(142,215),new Point(145,220),new Point(147,225),new Point(148,231),new Point(147,239),new Point(144,244),new Point(139,248),new Point(134,250),new Point(126,253),new Point(119,253),new Point(115,253)));
	this.Unistrokes[14] = new Unistroke("star", new Array(new Point(75,250),new Point(75,247),new Point(77,244),new Point(78,242),new Point(79,239),new Point(80,237),new Point(82,234),new Point(82,232),new Point(84,229),new Point(85,225),new Point(87,222),new Point(88,219),new Point(89,216),new Point(91,212),new Point(92,208),new Point(94,204),new Point(95,201),new Point(96,196),new Point(97,194),new Point(98,191),new Point(100,185),new Point(102,178),new Point(104,173),new Point(104,171),new Point(105,164),new Point(106,158),new Point(107,156),new Point(107,152),new Point(108,145),new Point(109,141),new Point(110,139),new Point(112,133),new Point(113,131),new Point(116,127),new Point(117,125),new Point(119,122),new Point(121,121),new Point(123,120),new Point(125,122),new Point(125,125),new Point(127,130),new Point(128,133),new Point(131,143),new Point(136,153),new Point(140,163),new Point(144,172),new Point(145,175),new Point(151,189),new Point(156,201),new Point(161,213),new Point(166,225),new Point(169,233),new Point(171,236),new Point(174,243),new Point(177,247),new Point(178,249),new Point(179,251),new Point(180,253),new Point(180,255),new Point(179,257),new Point(177,257),new Point(174,255),new Point(169,250),new Point(164,247),new Point(160,245),new Point(149,238),new Point(138,230),new Point(127,221),new Point(124,220),new Point(112,212),new Point(110,210),new Point(96,201),new Point(84,195),new Point(74,190),new Point(64,182),new Point(55,175),new Point(51,172),new Point(49,170),new Point(51,169),new Point(56,169),new Point(66,169),new Point(78,168),new Point(92,166),new Point(107,164),new Point(123,161),new Point(140,162),new Point(156,162),new Point(171,160),new Point(173,160),new Point(186,160),new Point(195,160),new Point(198,161),new Point(203,163),new Point(208,163),new Point(206,164),new Point(200,167),new Point(187,172),new Point(174,179),new Point(172,181),new Point(153,192),new Point(137,201),new Point(123,211),new Point(112,220),new Point(99,229),new Point(90,237),new Point(80,244),new Point(73,250),new Point(69,254),new Point(69,252)));
	this.Unistrokes[15] = new Unistroke("pigtail", new Array(new Point(81,219),new Point(84,218),new Point(86,220),new Point(88,220),new Point(90,220),new Point(92,219),new Point(95,220),new Point(97,219),new Point(99,220),new Point(102,218),new Point(105,217),new Point(107,216),new Point(110,216),new Point(113,214),new Point(116,212),new Point(118,210),new Point(121,208),new Point(124,205),new Point(126,202),new Point(129,199),new Point(132,196),new Point(136,191),new Point(139,187),new Point(142,182),new Point(144,179),new Point(146,174),new Point(148,170),new Point(149,168),new Point(151,162),new Point(152,160),new Point(152,157),new Point(152,155),new Point(152,151),new Point(152,149),new Point(152,146),new Point(149,142),new Point(148,139),new Point(145,137),new Point(141,135),new Point(139,135),new Point(134,136),new Point(130,140),new Point(128,142),new Point(126,145),new Point(122,150),new Point(119,158),new Point(117,163),new Point(115,170),new Point(114,175),new Point(117,184),new Point(120,190),new Point(125,199),new Point(129,203),new Point(133,208),new Point(138,213),new Point(145,215),new Point(155,218),new Point(164,219),new Point(166,219),new Point(177,219),new Point(182,218),new Point(192,216),new Point(196,213),new Point(199,212),new Point(201,211)));
	*/
	//var Arr1 = new Array(new Point(-126.31213357478624,-2.2737367544323206e-13), new Point(-122.56777486590066 ,14.676675234650702),new Point(-118.64007529157954,21.558144199180788), new Point(-114.59560593493008, 20.710786008366085), new Point(-110.55113657828058  ,  Y=  19.863427817551383  }, Point { X=  -106.51092905817488  ,  Y=  18.373468989443154  }, Point { X=  -102.49073643226376  ,  Y=  13.86566007895135  }, Point { X=  -98.47054380635261  ,  Y=  9.357851168459547  }, Point { X=  -94.45035118044147  ,  Y=  4.850042257967743  }, Point { X=  -90.43015855453032  ,  Y=  0.3422333474759398  }, Point { X=  -86.40996592861919  ,  Y=  -4.165575563015864  }, Point { X=  -82.38977330270805  ,  Y=  -8.673384473507667  }, Point { X=  -78.36958067679691  ,  Y=  -13.18119338399947  }, Point { X=  -74.34938805088575  ,  Y=  -17.689002294491047  }, Point { X=  -70.32620897332427  ,  Y=  -21.86076637208089  }, Point { X=  -66.28960436125865  ,  Y=  -24.521847529831348  }, Point { X=  -62.25299974919301  ,  Y=  -27.182928687581807  }, Point { X=  -58.216395137127364  ,  Y=  -29.844009845332266  }, Point { X=  -54.17979052506175  ,  Y=  -32.505091003082725  }, Point { X=  -50.1431859129961  ,  Y=  -35.166172160833185  }, Point { X=  -46.10658130093046  ,  Y=  -37.82725331858387  }, Point { X=  -42.06997668886481  ,  Y=  -40.4883344763341  }, Point { X=  -38.03337207679917  ,  Y=  -43.14941563408479  }, Point { X=  -33.99676746473352  ,  Y=  -45.810496791835476  }, Point { X=  -29.960162852667878  ,  Y=  -48.471577949585935  }, Point { X=  -25.923558240602233  ,  Y=  -51.13265910733662  }, Point { X=  -21.886953628536588  ,  Y=  -53.79374026508731  }, Point { X=  -17.84247768715744  ,  Y=  -53.74312118738408  }, Point { X=  -13.797242240668481  ,  Y=  -53.43084996643984  }, Point { X=  -9.75200679417955  ,  Y=  -53.11857874549537  }, Point { X=  -5.706771347690619  ,  Y=  -52.80630752455113  }, Point { X=  -1.6615359012016597  ,  Y=  -52.49403630360689  }, Point { X=  2.3836995452872713  ,  Y=  -52.18176508266242  }, Point { X=  6.428934991776202  ,  Y=  -51.86949386171818  }, Point { X=  10.474170438265162  ,  Y=  -51.557222640773716  }, Point { X=  14.519405884754093  ,  Y=  -51.244951419829476  }, Point { X=  18.564641331243024  ,  Y=  -50.93268019888524  }, Point { X=  22.609876777731984  ,  Y=  -50.620408977941  }, Point { X=  26.65511222422097  ,  Y=  -50.308137756996985  }, Point { X=  30.700347670709903  ,  Y=  -49.99586653605297  }, Point { X=  34.745583117198834  ,  Y=  -49.68359531510873  }, Point { X=  38.76997344570984  ,  Y=  -47.168425070712374  }, Point { X=  42.7491794835432  ,  Y=  -39.878207262918295  }, Point { X=  46.72838552137645  ,  Y=  -32.58798945512444  }, Point { X=  50.70759155920982  ,  Y=  -25.29777164733082  }, Point { X=  54.68679759704307  ,  Y=  -18.00755383953674  }, Point { X=  58.66600363487643  ,  Y=  -10.717336031742889  }, Point { X=  62.64520967270974  ,  Y=  -3.42711822394881  }, Point { X=  66.62441571054305  ,  Y=  3.863099583845269  }, Point { X=  70.60362174837636  ,  Y=  11.15331739163912  }, Point { X=  74.58282778620966  ,  Y=  18.4435351994332  }, Point { X=  78.54700802599936  ,  Y=  26.51157614097633  }, Point { X=  82.51108840386493  ,  Y=  34.584786519412546  }, Point { X=  86.4751687817305  ,  Y=  42.657996897848534  }, Point { X=  90.42606027062973  ,  Y=  51.210741156529366  }, Point { X=  94.24477765660893  ,  Y=  64.56919426624813  }, Point { X=  98.06349504258807  ,  Y=  77.92764737596667  }, Point { X=  101.88221242856721  ,  Y=  91.28610048568567  }, Point { X=  105.70092981454641  ,  Y=  104.6445535954042  }, Point { X=  109.51964720052561  ,  Y=  118.0030067051232  }, Point { X=  113.05472502135004  ,  Y=  137.67460625711442  }, Point { X=  116.58794119819387  ,  Y=  157.3876416047999  }, Point { X=  120.1370457086413  ,  Y=  176.8125138883786  }, Point { X=  123.68786642521374  ,  Y=  196.2062597349127  })
	//var Arr1 = new Array(new Point(-129.97785566796688,-1.8189894035458565e-12),new Point(-125.82114327837189,Y=  -1.1791651193011603  }, Point { X=  -121.66443088877679  ,  Y=  -2.3583302386009564  }, Point { X=  -117.5077184991818  ,  Y=  -3.537495357899843  }, Point { X=  -113.3510061095867  ,  Y=  -4.716660477199184  }, Point { X=  -109.19429371999172  ,  Y=  -5.89582559649898  }, Point { X=  -105.03758133039662  ,  Y=  -7.074990715797867  }, Point { X=  -100.88086894080152  ,  Y=  -8.254155835097208  }, Point { X=  -96.72415655120642  ,  Y=  -9.433320954396095  }, Point { X=  -92.56744416161132  ,  Y=  -10.612486073694981  }, Point { X=  -88.41073177201622  ,  Y=  -11.791651192994777  }, Point { X=  -84.25401938242112  ,  Y=  -12.97081631229321  }, Point { X=  -80.09730699282613  ,  Y=  -14.149981431593005  }, Point { X=  -75.94059460323092  ,  Y=  -15.329146550891892  }, Point { X=  -71.78388221363582  ,  Y=  -16.508311670190324  }, Point { X=  -67.62716982404095  ,  Y=  -17.68747678949012  }, Point { X=  -63.470457434445734  ,  Y=  -18.866641908789006  }, Point { X=  -59.31374504485075  ,  Y=  -20.045807028087893  }, Point { X=  -55.16245280303292  ,  Y=  -21.741845711956557  }, Point { X=  -51.0221455809741  ,  Y=  -24.485432645987203  }, Point { X=  -46.8818383589155  ,  Y=  -27.229019580018758  }, Point { X=  -42.74153113685668  ,  Y=  -29.972606514050312  }, Point { X=  -38.601223914797856  ,  Y=  -32.71619344808187  }, Point { X=  -34.460916692739374  ,  Y=  -35.45978038211297  }, Point { X=  -30.320609470680438  ,  Y=  -38.20336731614452  }, Point { X=  -26.16412938452504  ,  Y=  -39.134840808725585  }, Point { X=  -22.00465643259895  ,  Y=  -39.73097405122644  }, Point { X=  -17.845183480673086  ,  Y=  -40.327107293728204  }, Point { X=  -13.685710528747222  ,  Y=  -40.923240536228604  }, Point { X=  -9.526237576821359  ,  Y=  -41.51937377873037  }, Point { X=  -5.366764624895495  ,  Y=  -42.115507021231224  }, Point { X=  -1.2072916729696317  ,  Y=  -42.711640263732534  }, Point { X=  2.952181278956232  ,  Y=  -43.30777350623339  }, Point { X=  7.111654230882095  ,  Y=  -43.90390674873515  }, Point { X=  11.271127182807959  ,  Y=  -44.50003999123601  }, Point { X=  15.430600134733822  ,  Y=  -45.09617323373641  }, Point { X=  19.590073086659686  ,  Y=  -45.69230647623817  }, Point { X=  23.736080673307924  ,  Y=  -44.38706829282319  }, Point { X=  27.86836054551236  ,  Y=  -41.14341377622577  }, Point { X=  32.00064041771702  ,  Y=  -37.8997592596279  }, Point { X=  36.13292028992146  ,  Y=  -34.65610474303094  }, Point { X=  40.26520016212612  ,  Y=  -31.412450226433975  }, Point { X=  44.39748003433033  ,  Y=  -28.16879570983565  }, Point { X=  48.52975990653499  ,  Y=  -24.925141193238687  }, Point { X=  52.66203977873943  ,  Y=  -21.681486676641725  }, Point { X=  56.79431965094409  ,  Y=  -18.437832160043854  }, Point { X=  60.926599523148525  ,  Y=  -15.194177643446437  }, Point { X=  65.03331331957725  ,  Y=  -11.059902986620273  }, Point { X=  69.04909850024228  ,  Y=  -3.7580379169316984  }, Point { X=  73.06488368090686  ,  Y=  3.543827152756421  }, Point { X=  77.0806688615719  ,  Y=  10.84569222244454  }, Point { X=  81.0964540422367  ,  Y=  18.14755729213266  }, Point { X=  85.09475378737147  ,  Y=  25.855584387635645  }, Point { X=  89.07139184419339  ,  Y=  34.066781975673166  }, Point { X=  93.04802990101507  ,  Y=  42.27797956371069  }, Point { X=  96.97923827187356  ,  Y=  51.202926078465225  }, Point { X=  100.61137463286013  ,  Y=  64.8266135493268  }, Point { X=  104.24351099384671  ,  Y=  78.45030102018836  }, Point { X=  107.87564735483306  ,  Y=  92.07398849104993  }, Point { X=  110.65693406306514  ,  Y=  111.93883104119277  }, Point { X=  112.99823663030702  ,  Y=  135.0310466618348  }, Point { X=  115.33953919754913  ,  Y=  158.1232622824773  }, Point { X=  117.68084176479124  ,  Y=  181.21547790311934  }, Point { X=  120.02214433203312  ,  Y=  204.30769352376183  }]
	//var Arr1 = Array[Point { X=  -126.88529107680031  ,  Y=  -4.547473508864641e-13  }, Point { X=  -123.03731752031852  ,  Y=  -7.74880933599934  }, Point { X=  -119.05037998390982  ,  Y=  -13.536010405222441  }, Point { X=  -115.06344244750115  ,  Y=  -19.323211474445202  }, Point { X=  -111.03573052660587  ,  Y=  -23.45303372188016  }, Point { X=  -106.99245978744344  ,  Y=  -26.950428129808074  }, Point { X=  -102.94918904828101  ,  Y=  -30.447822537736215  }, Point { X=  -98.90591830911856  ,  Y=  -33.94521694566424  }, Point { X=  -94.8626475699561  ,  Y=  -37.44261135359204  }, Point { X=  -90.81937683079366  ,  Y=  -40.94000576152007  }, Point { X=  -86.7761060916312  ,  Y=  -44.43740016944787  }, Point { X=  -82.72675155030649  ,  Y=  -47.4574598238986  }, Point { X=  -78.65627328738441  ,  Y=  -48.82015354627447  }, Point { X=  -74.58579502446233  ,  Y=  -50.18284726865011  }, Point { X=  -70.51531676154022  ,  Y=  -51.54554099102597  }, Point { X=  -66.44483849861811  ,  Y=  -52.90823471340184  }, Point { X=  -62.37436023569603  ,  Y=  -54.270928435777705  }, Point { X=  -58.30388197277392  ,  Y=  -55.633622158153685  }, Point { X=  -54.233403709851814  ,  Y=  -56.99631588052955  }, Point { X=  -50.16292544692976  ,  Y=  -58.3590096029053  }, Point { X=  -46.092447184007625  ,  Y=  -59.721703325281396  }, Point { X=  -42.02224584887455  ,  Y=  -60.27700822739894  }, Point { X=  -37.952747376705105  ,  Y=  -58.78310130756029  }, Point { X=  -33.88324890453566  ,  Y=  -57.28919438772175  }, Point { X=  -29.81375043236625  ,  Y=  -55.7952874678831  }, Point { X=  -25.744251960196777  ,  Y=  -54.301380548044335  }, Point { X=  -21.674753488027363  ,  Y=  -52.80747362820557  }, Point { X=  -17.60525501585795  ,  Y=  -51.31356670836681  }, Point { X=  -13.535756543688535  ,  Y=  -49.81965978852827  }, Point { X=  -9.466258071519064  ,  Y=  -48.325752868689506  }, Point { X=  -5.39675959934965  ,  Y=  -46.83184594885074  }, Point { X=  -1.3272611271802361  ,  Y=  -45.33793902901175  }, Point { X=  2.7422373449892348  ,  Y=  -43.8440321091731  }, Point { X=  6.811735817158649  ,  Y=  -42.35012518933411  }, Point { X=  10.845343831414368  ,  Y=  -38.66040235948219  }, Point { X=  14.86214969191363  ,  Y=  -33.9427061159256  }, Point { X=  18.878955552412833  ,  Y=  -29.225009872369128  }, Point { X=  22.895761412912094  ,  Y=  -24.50731362881254  }, Point { X=  26.912567273411298  ,  Y=  -19.78961738525595  }, Point { X=  30.92937313391056  ,  Y=  -15.071921141699477  }, Point { X=  34.94617899440976  ,  Y=  -10.354224898142888  }, Point { X=  38.962984854908996  ,  Y=  -5.636528654586527  }, Point { X=  42.97979071540826  ,  Y=  -0.9188324110298254  }, Point { X=  46.99659657590749  ,  Y=  3.798863832526763  }, Point { X=  51.013402436406665  ,  Y=  8.516560076083124  }, Point { X=  55.02119400959023  ,  Y=  13.541805130305193  }, Point { X=  58.99205554396147  ,  Y=  19.827026610487565  }, Point { X=  62.96291707833265  ,  Y=  26.112248090669937  }, Point { X=  66.93377861270389  ,  Y=  32.39746957085208  }, Point { X=  70.90464014707507  ,  Y=  38.68269105103445  }, Point { X=  74.87550168144631  ,  Y=  44.967912531216825  }, Point { X=  78.84636321581749  ,  Y=  51.25313401139874  }, Point { X=  82.74263920912674  ,  Y=  59.24245107671254  }, Point { X=  86.56230060263081  ,  Y=  68.98222271305417  }, Point { X=  90.38196199613495  ,  Y=  78.7219943493958  }, Point { X=  94.20162338963902  ,  Y=  88.46176598573766  }, Point { X=  98.02128478314316  ,  Y=  98.20153762207951  }, Point { X=  101.80706216926964  ,  Y=  108.49730419820844  }, Point { X=  105.5021674836278  ,  Y=  120.28088809539122  }, Point { X=  109.19727279798596  ,  Y=  132.064471992574  }, Point { X=  112.85287845395786  ,  Y=  144.36700310212154  }, Point { X=  116.37634711796207  ,  Y=  158.4055523554514  }, Point { X=  119.82236638146375  ,  Y=  173.2573950893784  }, Point { X=  123.11470892319969  ,  Y=  189.72299177260106  }];
	//this.Unistrokes = new Array(NumUnistrokes);
	//this.Unistrokes[0] = new Unistroke("front", Arr1);

	//
	// The $1 Gesture Recognizer API begins here -- 3 methods: Recognize(), AddGesture(), and DeleteUserGestures()
	//
	this.Recognize = function(points, useProtractor)
	{
		points = Resample(points, NumPoints);
		var radians = IndicativeAngle(points);
		points = RotateBy(points, -radians);
		points = ScaleTo(points, SquareSize);
		points = TranslateTo(points, Origin);
		var vector = Vectorize(points); // for Protractor

		var b = +Infinity;
		var u = -1;
		for (var i = 0; i < this.Unistrokes.length; i++) // for each unistroke
		{
			var d;
			if (useProtractor) // for Protractor
				d = OptimalCosineDistance(this.Unistrokes[i].Vector, vector);
			else // Golden Section Search (original $1)
				d = DistanceAtBestAngle(points, this.Unistrokes[i], -AngleRange, +AngleRange, AnglePrecision);
			if (d < b) {
				b = d; // best (least) distance
				u = i; // unistroke
			}
		}
		return (u == -1) ? new Result("No match.", 0.0) : new Result(this.Unistrokes[u].Name, useProtractor ? 1.0 / b : 1.0 - b / HalfDiagonal);
	};
	this.AddGesture = function(name, points)
	{
		this.Unistrokes[this.Unistrokes.length] = new Unistroke(name, points); // append new unistroke
		var len = this.Unistrokes.length - 1;
		console.log(this.Unistrokes[len].Points);
		var num = 0;
		for (var i = 0; i < this.Unistrokes.length; i++) {
			if (this.Unistrokes[i].Name == name)
				num++;
		}
		return num;
	}
	this.DeleteUserGestures = function()
	{
		this.Unistrokes.length = NumUnistrokes; // clear any beyond the original set
		return NumUnistrokes;
	}
}
//
// Private helper functions from this point down
//
function Resample(points, n)
{
	var I = PathLength(points) / (n - 1); // interval length
	var D = 0.0;
	var newpoints = new Array(points[0]);
	for (var i = 1; i < points.length; i++)
	{
		var d = Distance(points[i - 1], points[i]);
		if ((D + d) >= I)
		{
			var qx = points[i - 1].X + ((I - D) / d) * (points[i].X - points[i - 1].X);
			var qy = points[i - 1].Y + ((I - D) / d) * (points[i].Y - points[i - 1].Y);
			var q = new Point(qx, qy);
			newpoints[newpoints.length] = q; // append new point 'q'
			points.splice(i, 0, q); // insert 'q' at position i in points s.t. 'q' will be the next i
			D = 0.0;
		}
		else D += d;
	}
	if (newpoints.length == n - 1) // somtimes we fall a rounding-error short of adding the last point, so add it if so
		newpoints[newpoints.length] = new Point(points[points.length - 1].X, points[points.length - 1].Y);
	return newpoints;
}
function IndicativeAngle(points)
{
	var c = Centroid(points);
	return Math.atan2(c.Y - points[0].Y, c.X - points[0].X);
}
function RotateBy(points, radians) // rotates points around centroid
{
	var c = Centroid(points);
	var cos = Math.cos(radians);
	var sin = Math.sin(radians);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = (points[i].X - c.X) * cos - (points[i].Y - c.Y) * sin + c.X
		var qy = (points[i].X - c.X) * sin + (points[i].Y - c.Y) * cos + c.Y;
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function ScaleTo(points, size) // non-uniform scale; assumes 2D gestures (i.e., no lines)
{
	var B = BoundingBox(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X * (size / B.Width);
		var qy = points[i].Y * (size / B.Height);
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function TranslateTo(points, pt) // translates points' centroid
{
	var c = Centroid(points);
	var newpoints = new Array();
	for (var i = 0; i < points.length; i++) {
		var qx = points[i].X + pt.X - c.X;
		var qy = points[i].Y + pt.Y - c.Y;
		newpoints[newpoints.length] = new Point(qx, qy);
	}
	return newpoints;
}
function Vectorize(points) // for Protractor
{
	var sum = 0.0;
	var vector = new Array();
	for (var i = 0; i < points.length; i++) {
		vector[vector.length] = points[i].X;
		vector[vector.length] = points[i].Y;
		sum += points[i].X * points[i].X + points[i].Y * points[i].Y;
	}
	var magnitude = Math.sqrt(sum);
	for (var i = 0; i < vector.length; i++)
		vector[i] /= magnitude;
	return vector;
}
function OptimalCosineDistance(v1, v2) // for Protractor
{
	var a = 0.0;
	var b = 0.0;
	for (var i = 0; i < v1.length; i += 2) {
		a += v1[i] * v2[i] + v1[i + 1] * v2[i + 1];
                b += v1[i] * v2[i + 1] - v1[i + 1] * v2[i];
	}
	var angle = Math.atan(b / a);
	return Math.acos(a * Math.cos(angle) + b * Math.sin(angle));
}
function DistanceAtBestAngle(points, T, a, b, threshold)
{
	var x1 = Phi * a + (1.0 - Phi) * b;
	var f1 = DistanceAtAngle(points, T, x1);
	var x2 = (1.0 - Phi) * a + Phi * b;
	var f2 = DistanceAtAngle(points, T, x2);
	while (Math.abs(b - a) > threshold)
	{
		if (f1 < f2) {
			b = x2;
			x2 = x1;
			f2 = f1;
			x1 = Phi * a + (1.0 - Phi) * b;
			f1 = DistanceAtAngle(points, T, x1);
		} else {
			a = x1;
			x1 = x2;
			f1 = f2;
			x2 = (1.0 - Phi) * a + Phi * b;
			f2 = DistanceAtAngle(points, T, x2);
		}
	}
	return Math.min(f1, f2);
}
function DistanceAtAngle(points, T, radians)
{
	var newpoints = RotateBy(points, radians);
	return PathDistance(newpoints, T.Points);
}
function Centroid(points)
{
	var x = 0.0, y = 0.0;
	for (var i = 0; i < points.length; i++) {
		x += points[i].X;
		y += points[i].Y;
	}
	x /= points.length;
	y /= points.length;
	return new Point(x, y);
}
function BoundingBox(points)
{
	var minX = +Infinity, maxX = -Infinity, minY = +Infinity, maxY = -Infinity;
	for (var i = 0; i < points.length; i++) {
		minX = Math.min(minX, points[i].X);
		minY = Math.min(minY, points[i].Y);
		maxX = Math.max(maxX, points[i].X);
		maxY = Math.max(maxY, points[i].Y);
	}
	return new Rectangle(minX, minY, maxX - minX, maxY - minY);
}
function PathDistance(pts1, pts2)
{
	var d = 0.0;
	for (var i = 0; i < pts1.length; i++) // assumes pts1.length == pts2.length
		d += Distance(pts1[i], pts2[i]);
	return d / pts1.length;
}
function PathLength(points)
{
	var d = 0.0;
	for (var i = 1; i < points.length; i++)
		d += Distance(points[i - 1], points[i]);
	return d;
}
function Distance(p1, p2)
{
	var dx = p2.X - p1.X;
	var dy = p2.Y - p1.Y;
	return Math.sqrt(dx * dx + dy * dy);
}
function Deg2Rad(d) { return (d * Math.PI / 180.0); }