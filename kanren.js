var Kanren;
if(!Kanren) Kanren = {};

Kanren.Keywords={};

Kanren.Keywords = function(result,status,error,value_box){
	this.result= result || "";
	this.status= status || "";
	this.error= error || "";
	this.value_box= value_box || "";
};

Kanren.Keywords.prototype.get=function(keyword){
		value=localStorage.history||"";
		localStorage.setItem("history" , value+'<a class="tag" href="#">'+keyword+'</a>, ');
		$(this.result).empty();
		$(this.status).text('Twitterからデータを取得しています。(数秒かかります)');
		this.getTwDump(keyword);
		//get_callback へ
	};
	
Kanren.Keywords.prototype.get_callBack = function(json,keyword){
		$(this.status).text('取得完了。解析中です。');
		var dump=this.dumpJson(json);
		var kw_rank=this.parse(dump,keyword);
		this.output(kw_rank,keyword);
	};

Kanren.Keywords.prototype.getTwDump = function(keyword){
		var dump_text;
		var kanren= this;
		d_keyword=encodeURIComponent(keyword);
		var url=	'http://search.twitter.com/search.json?rpp=100&callback=?&q='+d_keyword;
		$.ajaxSetup({
			"timeout":2500,
			"error":function(request,status) {
				$(kanren.error).text(status+" :Twitterでエラーが発生しました。リトライしてみてください。");
			}
		});
		$.getJSON(url, function(json){
			kanren.get_callBack(json,keyword);
		});
	};

Kanren.Keywords.prototype.dumpJson=function(json){
		var dump_text="";
		for(var result in json.results){
			dump_text+=json.results[result].text+"\n";
		}
		return dump_text;
	};
	
Kanren.Keywords.prototype.parse = function(text,keyword){	
		var counter= new Kanren.Counter();
		
		//簡易名詞抽出エンジン Nipa v0.1
		var lines = text.split("\n");
		var noise=/[^ァ-ヴ一-龠0-9０-９ーの]+/g;
		for(var i=0;i<lines.length;i++){
			tags=lines[i].replace(noise," ").split(" ");
			for(var j=0;j<tags.length;j++){
				if(tags[j].indexOf("の")==0){
					tags[j]=tags[j].slice(1);
				}
				if(isNaN(tags[j])&&tags[j].length>1&&tags[j]!=keyword){
					counter.add(tags[j]);
				}
			}
		}
		return counter.sort();
	};
	
Kanren.Keywords.prototype.output = function(kw_rank,keyword){
		$(this.status).text("別の単語を入力するか、キーワードをクリックすることで次のかんれんを見つけられます。");
		TagGraph.addNode(keyword,{label:keyword, width:60, color:"#444"});
		var i=0;
		for(var kw in kw_rank){
			if(i<6){
				i++;
				$(this.result).append('<li><a class="tag" href="#">'+kw+"</a>:　"+kw_rank[kw]+"Pt.</li>");
				var color = Math.floor(Math.random() * 0xFFFFFF).toString(16);
				for(count = color.length; count < 6; count++){
					color = "0" + color;
				}
				color = "#" + color;
				var width = kw_rank[kw];
				TagGraph.addNode(kw,{label:kw, width:60, color:color});
				TagGraph.addEdge(keyword,kw,{width:6-i,color:color});
			}
		}
		var kanren=this;
		$(".tag").click(function(){
				$(kanren.value_box).val($(this).text());
				$(kanren.result).empty();
				kanren.get($(this).text());
		});
	}
	


Kanren.Counter = function(){
	this.kw_list = [];
};

Kanren.Counter.prototype.add=function(keyword){
		if(!this.kw_list[keyword] ){
			this.kw_list[keyword]=0;
		}
		this.kw_list[keyword]+=10+keyword.length;
};

Kanren.Counter.prototype.sort=function(){
		var ary = new Array();
		for(var i in this.kw_list){
			ary.push({key:i, value:this.kw_list[i]});
		}
		ary = ary.sort(sortFunc);
		var ret = new Object();
		for(var i = 0; i < ary.length; i++){
			ret[ary[i].key] = ary[i].value;
		}
		return ret;
		
		function sortFunc(left, right){
			var a = left["value"], b = right["value"];
			return a > b ? -1 : a < b ? 1 : 0;
		}
};