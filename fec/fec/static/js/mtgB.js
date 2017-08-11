$('#hearings_form').submit(function(e) { // catch the form's submit event
     e.preventDefault()
        var $year = $(":input[name='year']").val();
        var $search = $(":input[name='search']").val();
        var $year_h = $(":input[name='year_h']").find(":selected").val()
        var $search_h = $(":input[name='search_h']").val();
        var $tab = 'hearings'

        $.ajax({ // create an AJAX call...
            data: $(this).serialize(), // get the form data
            datatype: 'json',
            type: $(this).attr('method'), // GET or POST
            url: $(this).attr('action'), // the file to call
        });
        //return false;
        alert($year_h)
        //alert (data)
        location.href = document.location.origin +"/meetings/?tab=hearings&year_h="+$year_h+"&search="
        //$('#test').html(data)
        //$('#hearings_table').css('color','#f90')
        //$.get('/meetings', {'years_h': years_h })

        return $year_h
    });


$('#openmeetings_form').submit(function(e) { // catch the form's submit event
     e.preventDefault()
        var $year = $(":input[name='year']").val();
        var $search = $(":input[name='search']").val();
        var $year_h = $(":input[name='year_h']").find(":selected").val()
        var $search_h = $(":input[name='search_h']").val();
        var $tab = 'hearings'

        $.ajax({ // create an AJAX call...
            data: $(this).serialize(), // get the form data
            datatype: 'json',
            type: $(this).attr('method'), // GET or POST
            url: $(this).attr('action'), // the file to call
        });
        //return false;
        alert($year)
        //alert (data)
        location.href = document.location.origin +"/meetings/?tab=open-meetings&year="+$year+"&search="
        //$('#test').html(data)
        //$('#hearings_table').css('color','#f90')
        //$.get('/meetings', {'years_h': years_h })
        return $year
        return $year_h
    });

$('#executive_form').submit(function(e) { // catch the form's submit event
     e.preventDefault()
        var $year = $(":input[name='year']").val();
        var $search = $(":input[name='search']").val();
        var $year_h = $(":input[name='year_h']").find(":selected").val()
        var $search_h = $(":input[name='search_h']").val();
        var $year_e = $(":input[name='year_e']").find(":selected").val()
        var $search_e = $(":input[name='search_e']").val();
        var $tab = 'hearings'

        $.ajax({ // create an AJAX call...
            data: $(this).serialize(), // get the form data
            datatype: 'json',
            type: $(this).attr('method'), // GET or POST
            url: $(this).attr('action'), // the file to call
        });
        //return false;
        alert($year_h)
        //alert (data)
        location.href = document.location.origin +"/meetings/?tab=executive-sessions&year_e="+$year_e+"&search="
        //$('#test').html(data)
        //$('#hearings_table').css('color','#f90')

        return $year_e

        //$.get('/meetings', {'years_h': years_h })
    });

//$('#hearings_tab').click(function(){

   //alert('clicked')
   //location.href = document.location.origin +"/meetings/?tab=hearings&year_h="+$year_h+"&search="


  //})


   //  $('#hearings_form').submit(function(e) {
   //      e.preventDefault()
   //      var $year = $(":input[name='year']").val();
   //      var $search = $(":input[name='search']").val();
   //      var $year_h = $(":input[name='year_h']").find(":selected").val()
   //      var $search_h = $(":input[name='search_h']").val();
   //      var $tab = 'hearings'

   //      //alert($year)

   //      $.ajax({
   //          method: "GET",
   //          url: "/meetings",
   //          datatype: 'text',
   //          data: { year : $year_h , tab : 'hearings' , search:"" },


   //     });



   //    //alert($year_h)
   //    //console.log(data)

   // })


                //  ,
                // error: function(result) {
                //     var data_received = $(result).find("h1");
                //     alert(data_received );
                // },
                //success: function(result) {
                //   alert(data);
                //}
                //});








