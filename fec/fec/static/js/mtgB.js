

    $('#hearings_form').submit(function(e) {
        e.preventDefault()
        var $year = $(":input[name='year']").val();
        var $search = $(":input[name='search']").val();
        var $year_h = $(":input[name='year_h']").find(":selected").val()
        var $search_h = $(":input[name='search_h']").val();
        var $tab = 'hearings'

        //alert($year)

        $.ajax({
            type: "GET",
            url: "/meetings",
            //datatype: 'jason',
            data: { year : $year_h , tab : 'hearings' , search:"" }


      })
      alert($year_h)

   })


                //  ,
                // error: function(result) {
                //     var data_received = $(result).find("h1");
                //     alert(data_received );
                // },
                //success: function(result) {
                //   alert(data);
                //}
                //});








